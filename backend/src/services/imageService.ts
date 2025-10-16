import {Request,Response} from 'express';
import * as imageRepository from '../repositories/imageRepository';
import { imageSchema } from '../schemas/imageSchema';
import {exec} from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const IMAGE_BASE_PATH = '/var/lib/qemu/images/';

export async function getAllImages(req:Request,res:Response){
    try{
        const images = await imageRepository.getAllImages();
        if (images.length === 0){
            return res.status(404).json({message: "No images found"});
        }
        return res.status(200).json(images);
    }
    catch(err){
        console.error(err);
        return res.status(500).json({message: "Internal server error"});
    }
   
}

export async function uploadImage(req:Request,res:Response){
    try{
        const reqData = req.body;
        const parsed = imageSchema.safeParse(reqData);

        if (!parsed.success){
            return res.status(400).json({message: "Invalid request data"});
        }
        const imageData = parsed.data;

        const imagePath = `qemu-img create -f qcow2 ${IMAGE_BASE_PATH}${imageData.name}.qcow2 ${imageData.size}G`;

        const {stdout,stderr} = await execAsync(imagePath);

        if (stderr){
            console.error(stderr);
            return res.status(500).json({message: "Error creating image"});
        }

        const newImage = await imageRepository.createImage({
           ...imageData,
           path : imagePath
        })
        
        if (!newImage){
            return res.status(500).json({message: "Error saving image to database"});
        }

        return res.status(201).json(newImage);
    }
    catch(err){
        console.error(err);
        return res.status(500).json({message: "Internal server error"});
    }
}

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
            console.error(stderr);
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