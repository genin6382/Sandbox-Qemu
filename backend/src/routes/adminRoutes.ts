/**Routes for /admins */
import express from 'express';
import * as adminService from '../services/adminService'
const router = express.Router();

router.post('/register',adminService.registerUser);
router.post('/login',adminService.loginUser);
router.get('/summary', adminService.getSummary);

export default router;