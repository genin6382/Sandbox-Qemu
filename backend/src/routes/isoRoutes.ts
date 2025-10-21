/**Routes for /isos */

import express from 'express';
import * as isoService from '../services/isoService';

const router = express.Router();

router.post('/', isoService.createISO);
router.get('/', isoService.getAllISOs);

export default router;