/**File for implementing logic behind /images route calls */
import {Request,Response} from 'express';
import * as imageRepository from '../repositories/imageRepository';
import { imageSchema } from '../schemas/imageSchema';
import {exec} from 'child_process';
import { promisify } from 'util';
import { createId } from '@paralleldrive/cuid2';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);
const IMAGE_BASE_PATH = path.join(process.cwd(), 'qemu', 'images');

if (!fs.existsSync(IMAGE_BASE_PATH)) {
  fs.mkdirSync(IMAGE_BASE_PATH, { recursive: true });
}

/**Returns list of images */
export async function getAllImages(req:Request,res:Response){
    try{
        const images = await imageRepository.getAllImages();
        if (images.length === 0){
            return res.status(200).json([]);
        }
        return res.status(200).json(images);
    }
    catch(err){
        console.error(err);
        return res.status(500).json({message: "Internal server error"});
    }
}

/**Creates base Image for specific ISO */
export async function createBaseImageForISO(isoId: string, size: number = 20) {
    const imageName = `base-${isoId}-${createId()}`;
    const imagePath = path.join(IMAGE_BASE_PATH, `${imageName}.qcow2`); //This creates proper path seperators 
    
    const imageCommand = `qemu-img create -f qcow2 ${imagePath} ${size}G`;
    const {stdout, stderr} = await execAsync(imageCommand);
    
    if (stderr) {
        console.error('Error creating base image:', stderr);
        throw new Error('Failed to create base image file');
    }
    
    console.log('Base image created:', stdout);
    
    const newImage = await imageRepository.createImage({
        name: imageName,
        path: imagePath,
        size,
        isoId,
        overlayCount: 0
    });
    
    return newImage;
}
/**Function to create qemu base image */
export async function uploadImage(req:Request,res:Response){
    try{
        const reqData = req.body;
        const parsed = imageSchema.safeParse(reqData);

        if (!parsed.success){
            return res.status(400).json({message: "Invalid request data"});
        }
        
        const imageData = parsed.data;
        const imageCommand = `qemu-img create -f qcow2 ${IMAGE_BASE_PATH}${imageData.name}.qcow2 ${imageData.size}G`;
        const {stdout,stderr} = await execAsync(imageCommand);

        if (stderr){
            console.log(stderr);
            return res.status(500).json({message: "Error creating image"});
        }
        
        const newImage = await imageRepository.createImage({
            ...imageData,
            path : path.join(IMAGE_BASE_PATH, `${imageData.name}.qcow2`)
        })

        if (!newImage){
            return res.status(500).json({message: "Error saving image to database"});
        }
        
        return res.status(201).json(newImage);
    }
    catch(err){
        console.log(err);
        return res.status(500).json({message: "Internal server error"});
    }
}

/**Deletes image */
export async function deleteImage(req:Request,res:Response){
    try{
        const imageId = req.params.id;
        const image = await imageRepository.getImageById(imageId);

        if (!image){
            return res.status(404).json({message: "Image not found"});
        }
        
        const deleteCommand = `rm -f ${IMAGE_BASE_PATH}${image.name}.qcow2`;
        const {stdout,stderr} = await execAsync(deleteCommand);

        if (stderr){
            console.log(stderr);
            return res.status(500).json({message: "Error deleting image file"});
        }
        
        const deleted = await imageRepository.deleteImage(imageId);
        if (deleted.count === 0){
            return res.status(500).json({message: "Error deleting image from database"});
        }
        
        return res.status(200).json({deleted, message: "Image deleted successfully"});
    }
    catch(err){
        console.error(err);
        return res.status(500).json({message: "Internal server error"});
    }
}
