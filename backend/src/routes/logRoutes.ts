/**Routes for /logs */
import express from 'express';
import { viewLogsById } from '../services/logService';
const router = express.Router();

router.get("/:nodeId",viewLogsById);

export default router;