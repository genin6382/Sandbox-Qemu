import { Request, Response } from "express";
import { getNodeById } from "../repositories/nodeRepository";
import { getLogById } from "../repositories/logRepository";

/**View Logs of a specific Node  */
export async function viewLogsById(req: Request, res: Response) {
  try {
    const { nodeId } = req.params;
    
    const node = await getNodeById(nodeId);
    if (!node) {
      return res.status(404).json({ message: "Node not found" });
    }
    
    const logs = await getLogById(nodeId);
    if (!logs || logs.length === 0) {
      return res.status(200).json([]);
    }
    
    return res.status(200).json(logs);
    
  } catch (error) {
    console.error("Error fetching logs:", error);
    return res.status(500).json({ message: "Failed to fetch logs" });
  }
}
