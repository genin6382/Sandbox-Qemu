import express from 'express';
import * as imageService from '../services/imageService';

const router = express.Router();

router.get('/', imageService.getAllImages);
router.post('/', imageService.uploadImage);
router.delete('/:id', imageService.deleteImage);

export default router;