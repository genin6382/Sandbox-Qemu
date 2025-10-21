import prisma from '../database/prisma';
import { NodeStatus } from '../generated/prisma';


export async function getAllNodes() {
    const nodes = await prisma.nodes.findMany({
      include: {
        baseImage: {
          include: {
            iso: true  
          }
        }
      }
    });
    return nodes;
}


export async function getLastUsedVncPort() {
  const lastNode = await prisma.nodes.findFirst({
        orderBy: { vncPort: 'desc' },
        select: { vncPort: true },
  });

  return lastNode?.vncPort || null;
}

export async function getNodeById(nodeId: string) {
  return await prisma.nodes.findUnique({
    where: { id: nodeId },
    include: { 
      baseImage: {
        include: {
          iso: true  
        }
      } 
    },
  });
}


export async function updateNodeById(nodeId: string, pid: number | null , status: NodeStatus) {
    return await prisma.nodes.update({
        where: { id: nodeId },
        data: { pid, status },
    });
}

export async function createNodeRecord(data: any, tx?: any) {
  const prismaClient = tx || prisma;
  return await prismaClient.nodes.create({
    data,
    include: { baseImage: true }
  });
}

export async function deleteNodeById(nodeId: string) {
  return await prisma.nodes.delete({
    where: { id: nodeId }
  });
}

