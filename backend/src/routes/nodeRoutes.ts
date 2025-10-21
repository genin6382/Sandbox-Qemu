/**Routes for /nodes */
import express from 'express';
import * as nodeService from '../services/nodeService';

const router = express.Router();

router.get('/',nodeService.getAllNodes); //should rmv this
router.post('/',nodeService.createNode);
router.post('/:nodeId/run',nodeService.startVM);
router.post('/:nodeId/stop',nodeService.stopVM);
router.post('/:nodeId/wipe',nodeService.wipeNode);


export default router;