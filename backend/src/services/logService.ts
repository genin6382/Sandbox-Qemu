import { Request,Response } from "express";
import { getNodeById } from "../repositories/nodeRepository";
import { getLogById } from "../repositories/logRepository";

export async function viewLogsById(req:Request,res:Response){
    try{
        const {nodeId} = req.params;
        const node = await getNodeById(nodeId);
              
        if (!node) {
            return res.status(404).json({ message: "Node not found" });
        }

        const logs = await getLogById(nodeId);

        if(!logs){
            return res.status(404).json({ message: "Logs not found" });
        }
        return res.status(200).json(logs);
    }
    catch(error){
        console.error("Error",error);
        return res.send(500).json({message:"Failed to fetch node"})
    }
}