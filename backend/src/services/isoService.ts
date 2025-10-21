import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../database/prisma';
import * as isoRepository from '../repositories/isoRepository';

const ISO_UPLOAD_DIR = './uploaded_isos';

if (!fs.existsSync(ISO_UPLOAD_DIR)) {
  fs.mkdirSync(ISO_UPLOAD_DIR, { recursive: true });
}

const ALLOWED_EXTENSIONS = ['.iso'];

// Expanded allowed MIME types for ISO files
const ALLOWED_MIME_TYPES = [
  'application/x-cd-image',
  'application/x-iso9660-image',
  'application/octet-stream',
  'application/x-compressed-iso',
  'application/x-gzip',
  'binary/octet-stream',
  ''
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, ISO_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path.basename(file.originalname, ext);
    cb(null, `${baseName}-${Date.now()}${ext}`);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error('Only .iso files are allowed'));
  }

  // Log MIME type warning but accept file if extension matches
  if (file.mimetype && !ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    console.log(`Warning: Unexpected MIME type "${file.mimetype}" for ISO file; accepting due to .iso extension.`);
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 * 1024, // 10GB limit
  },
}).single('iso');


/**This functionn recieves ISO as .iso file input ,Uploads it to a specific folder and saves it in database */
export function createISO(req: Request, res: Response) {
  upload(req, res, async function (err) {
    if (err) {
      return res.status(400).json({ error: err.message || 'Upload failed' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      // Save ISO metadata in the database
      const newIso = await prisma.iSOs.create({
        data: {
          name: req.file.originalname,
          path: req.file.path,
        },
      });

      return res.status(201).json({
        message: 'ISO uploaded and saved to DB successfully',
        isoId: newIso.isoId,
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
      });
    } catch (dbErr) {
      console.error('Error saving ISO info in DB:', dbErr);
      return res.status(500).json({ error: 'Failed to save ISO info in database' });
    }
  });
}
/**Retrieve all ISOs */
export async function getAllISOs(req:Request,res:Response){
  try{
     const isos = await isoRepository.getAllIso();
     if(!isos){
        return res.status(404).json({message:"No ISOs found"});
     }
     res.status(200).json(isos);
  }
  catch(error){
    console.error(error);
    return res.status(500).json({message:"Server couldnt fetch ISOs"})
  }
}
