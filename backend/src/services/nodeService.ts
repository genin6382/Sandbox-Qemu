// services/nodeService.ts
import { Request,Response } from 'express';
import { createId } from '@paralleldrive/cuid2';
import { exec } from 'child_process';
import { promisify } from 'util';
import { access } from 'fs/promises';
import prisma from '../database/prisma';
import * as guacamoleService from './guacamoleService';
import { allocateVncPort } from '../utils/portManager';
import { waitForVNCPort } from '../utils/portManager';
import * as imageRepository from '../repositories/imageRepository';
import { createLogEntry } from '../repositories/logRepository';
import * as nodeRepository from '../repositories/nodeRepository';
import * as isoRepository from '../repositories/isoRepository';
import { createBaseImageForISO } from './imageService';

const execAsync = promisify(exec);
const OVERLAYS_BASE_PATH = '../qemu/overlays';
const MAX_OVERLAYS = 5; 

/**Creates overlay for a particular base Image */
export async function createOverlay(baseImagePath: string, overlayPath: string){
    const command = `qemu-img create -f qcow2 -b ${baseImagePath} -F qcow2 ${overlayPath}`;
    const { stdout, stderr } = await execAsync(command);
    console.log('Overlay created:', stdout || stderr);
    await access(overlayPath);
}
/**Deletes overlay */
export async function deleteOverlay(overlayPath: string) {
    await execAsync(`rm -f ${overlayPath}`);
}

/**Checks if base Image is present for a particular ISO , if not present , it creates a new Base Image. If number of overlays for that particular base Image is exceeded 
 ,It creates a new base image* 
 */
async function allocateBaseImageForISO(isoId: string) {
    //find an available base image less than MAX_OVERLAYS
    let baseImage = await imageRepository.findAvailableImageForISO(
        isoId, 
        MAX_OVERLAYS
    );
    
    if (!baseImage) {
        console.log(`No available base image for ISO ${isoId}, creating new one...`);
        baseImage = await createBaseImageForISO(isoId);
    }
    
    return baseImage;
}

/**Retrieves All nodes */
export async function getAllNodes(req: Request,res:Response) {
  try{
    const nodes = await nodeRepository.getAllNodes();
    if (!nodes) {
      throw new Error("No nodes found");
    }
    
    res.status(200).json(nodes);
  }
  catch(error){
    console.error("Error fetching nodes:",error);
    res.status(500).json({error:"Failed to fetch nodes"});
  }
}

/** 
 * Creates a new node by generating an overlay image from a base ISO, 
 * allocating a VNC port, creating a Guacamole connection, and storing 
 * all metadata in the database transactionally.
 */
export async function createNode(req: Request, res: Response) {
    const { name, isoId } = req.body; 
    const iso = await isoRepository.getIsoById(isoId);

    if (!iso) {
        return res.status(404).json({ error: 'ISO not found' });
    }
    
    const nodeId = createId();
    const overlayPath = `${OVERLAYS_BASE_PATH}/node_${nodeId}.qcow2`;
    const vncPort = await allocateVncPort();
    
    let overlayCreated = false;
    let guacConnectionId: string | null = null;
    let allocatedBaseImage: any = null;
    
    try {
        const node = await prisma.$transaction(async (tx) => {
       
        allocatedBaseImage = await allocateBaseImageForISO(isoId);
        
        await createOverlay(allocatedBaseImage.path, overlayPath);
        overlayCreated = true;
        
        guacConnectionId = await guacamoleService.createVNCConnection(
            `Node: ${name}`,
            vncPort
        );
        
        await imageRepository.incrementOverlayCount(allocatedBaseImage.baseId);
        
        return await tx.nodes.create({
            data: {
            id: nodeId,
            name,
            overlayPath,
            vncPort,
            pid: null,
            gucaConnectionId: guacConnectionId,
            baseId: allocatedBaseImage.baseId
            },
            include: { baseImage: true },
        });
        });
        
        const logEntry = await createLogEntry(nodeId, `Node ${node.name} created successfully.`);
        if (!logEntry) {
            console.error(`Failed to create log entry for node ${nodeId}`);
        }
        
        return res.status(201).json({
            ...node,
            guacamoleUrl: guacamoleService.generateConnectionURL(guacConnectionId!),
        });
        
    } 
    catch (error: any) {
        if (overlayCreated) {
            await deleteOverlay(overlayPath).catch(() => {});
        }
        
        if (guacConnectionId) {
            await guacamoleService.deleteConnection(guacConnectionId).catch(() => {});
        }
        if (allocatedBaseImage) {
            await imageRepository.decrementOverlayCount(allocatedBaseImage.baseId).catch(() => {});
        }
        console.error('Error creating node:', error);
        return res.status(500).json({ error: 'Failed to create node', details: error.message });
    }
}
/**
 * Starts a VM (QEMU instance) for the given node by attaching the ISO, 
 * running it in daemonized mode, storing its PID, and updating the node’s status.
 */
export async function startVM(req: Request, res: Response) {
    try {
      const { nodeId } = req.params;
      const node = await nodeRepository.getNodeById(nodeId);
      
      if (!node) {
        return res.status(404).json({ message: "Node not found" });
      }
      
      const vncDisplay = node.vncPort - 5900;
      const pidFilePath = `/tmp/qemu_vm_${vncDisplay}.pid`;
      
      if (node.status === "RUNNING") {
        return res.status(400).json({ message: "Node is already running" });
      }
      
      // Clean up stale PID file
      try {
        await execAsync(`rm -f ${pidFilePath}`);
      } catch (err) {
        console.log('No stale PID file to clean');
      }
      
      // ALWAYS attach ISO for IDLE and STOPPED (until installed)
      const isoPath = node.baseImage.iso.path;
      let command = `qemu-system-x86_64 -drive file=${node.overlayPath},format=qcow2 -m 1024 -vnc :${vncDisplay} -cdrom ${isoPath} -boot d -daemonize -pidfile ${pidFilePath} -enable-kvm`;
      
      console.log('Executing QEMU command:', command);
      
      const { stdout, stderr } = await execAsync(command);
      console.log('VM started:', stdout || stderr);
      
      if (stderr && !stderr.includes('warning')) {
        return res.status(500).json({ message: "Failed to start VM", error: stderr });
      }
    
      const pid = parseInt((await execAsync(`cat ${pidFilePath}`)).stdout.trim(), 10);
      
      const updatedNode = await nodeRepository.updateNodeById(nodeId, pid, "RUNNING");
      
      if (!updatedNode) {
        return res.status(500).json({ message: "Failed to update node status" });
      }
      
      await createLogEntry(nodeId, `Node ${node.name} started with ISO attached.`);
      
      res.status(200).json({ 
        message: "VM started successfully", 
        node: updatedNode,
        isoAttached: true
      });
      
    } catch (error) {
      console.error("Error starting VM:", error);
      res.status(500).json({ error: "Failed to start VM" });
    }
}
/**
 * Stops a running VM by sending a SIGTERM signal to its process, 
 * clearing its PID, and updating the node’s status to STOPPED.
 */
export async function stopVM(req: Request,res:Response){
  try{
    const { nodeId } = req.params;
    const node = await nodeRepository.getNodeById(nodeId);
    if(!node){
      return res.status(404).json({message:"Node not found"});
    }
    
    if(node.status !== "RUNNING" || !node.pid){
      return res.status(400).json({message:"Node is not running"});
    }
    
    process.kill(node.pid, 'SIGTERM');
    const updatedNode = await nodeRepository.updateNodeById(nodeId, null , "STOPPED");
    if(!updatedNode){
      return res.status(500).json({message:"Failed to update node status"});
    }
    
    const logEntry = await createLogEntry(nodeId, `Node ${node.name} stopped successfully.`);
    if (!logEntry) {
      console.error(`Failed to create log entry for node ${nodeId}`);
    }
    
    res.status(200).json({message:"VM stopped successfully",node:updatedNode});
  }
  catch(error){
    console.error("Error stopping VM:",error);
    res.status(500).json({error:"Failed to stop VM"});
  }
}

/**
 * Completely wipes a node by stopping it if running, 
 * releasing its VNC port, deleting its overlay file, 
 * removing database records, decrementing overlay count, 
 * and deleting its Guacamole connection.
 */
export async function wipeNode(req: Request, res: Response) {
    try {
      const { nodeId } = req.params;
      const node = await nodeRepository.getNodeById(nodeId);

      if (!node) {
        return res.status(404).json({ message: 'Node not found' });
      }

      if (node.status === "RUNNING" && node.pid) {
        try {
          process.kill(node.pid, 'SIGTERM');
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (err) {
          console.log('Process already stopped or not found');
        }
      }

      // Release VNC port
      try {
        const { stdout } = await execAsync(`lsof -ti:${node.vncPort} || echo ""`);
        if (stdout.trim()) {
          await execAsync(`kill -9 ${stdout.trim()}`);
        }
      } catch (err) {
        console.log('Port already free');
      }

      await createLogEntry(nodeId, `Node ${node.name} deletion initiated.`);

      await prisma.$transaction(async (tx) => {
          await tx.logs.deleteMany({ where: { nodeId: nodeId } });
          await tx.nodes.delete({ where: { id: nodeId } });
          await tx.images.update({
            where: { baseId: node.baseId },
            data: { overlayCount: { decrement: 1 } },
          });
      });

      await deleteOverlay(node.overlayPath);

      if (node.gucaConnectionId) {
          await guacamoleService.deleteConnection(node.gucaConnectionId);
      }

      return res.status(200).json({ message: 'Node deleted successfully' });
    } 
    catch (error) {
      console.error('Error deleting node:', error);
      return res.status(500).json({ error: 'Failed to delete node' });
    }
}