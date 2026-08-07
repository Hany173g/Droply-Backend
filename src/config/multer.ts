import multer from 'multer';
import type { Request, Response, NextFunction } from 'express';
import { fileTypeFromBuffer , fileTypeFromFile } from 'file-type';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';

const uploadsDir = path.join(process.cwd(), 'uploads', 'videos');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
const allowedImageMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/jpg'
    ];
const allowedVideoMimeTypes = [
    'video/mp4',
    'video/quicktime', 
    'video/x-msvideo', 
    'video/webm',
    'video/x-matroska'
];
const imageFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (allowedImageMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File extension not allowed'));
  }
};
const videoFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (allowedVideoMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File extension not allowed'));
  }
};
const multerImageUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter:imageFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});
const multerVideoUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`),
  }),
  fileFilter:videoFilter,
  limits: { fileSize: 5120 * 1024 * 1024, files: 1 },
});


export function imageUpload(fieldName: string) {
  return [
    multerImageUpload.single(fieldName),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: 'Please upload an image' });
        }
        const type = await fileTypeFromBuffer(req.file.buffer);
        if (!type || !allowedImageMimeTypes.includes(type.mime)) {
          return res.status(400).json({ message: 'File is not a valid image' });
        }
        next();
      } catch (err) {
        next(err);
      }
    },
  ];
}

export function videoUpload(fieldName : string) {
  return [
    multerVideoUpload.single(fieldName),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: 'Please upload a video' });
        }
        const type = await fileTypeFromFile(req.file.path);
        if (!type || !allowedVideoMimeTypes.includes(type.mime)) {
          await fsPromises.unlink(req.file.path);
          return res.status(400).json({ message: 'File is not a valid video' });
        }
        next();
      } catch (err) {
        next(err);
      }
    },
  ];
}

const multerVideoWithThumb = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}_${file.fieldname}_${file.originalname}`),
  }),
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "video") {
      videoFilter(req, file, cb);
    } else if (file.fieldname === "thumbnail") {
      imageFilter(req, file, cb);
    } else {
      cb(new Error("Unexpected field"));
    }
  },
  limits: { fileSize: 5120 * 1024 * 1024, files: 2 },
});

export function videoWithThumbnailUpload() {
  return [
    multerVideoWithThumb.fields([
      { name: "video", maxCount: 1 },
      { name: "thumbnail", maxCount: 1 },
    ]),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const files = req.files as { [key: string]: Express.Multer.File[] };
        if (!files?.video?.[0]) {
          if (files?.thumbnail?.[0]) await fsPromises.unlink(files.thumbnail[0].path).catch(() => {});
          return res.status(400).json({ message: 'Please upload a video' });
        }
        if (!files?.thumbnail?.[0]) {
          await fsPromises.unlink(files.video[0].path).catch(() => {});
          return res.status(400).json({ message: 'Please upload a thumbnail' });
        }
        const type = await fileTypeFromFile(files.video[0].path);
        if (!type || !allowedVideoMimeTypes.includes(type.mime)) {
          await fsPromises.unlink(files.video[0].path);
          await fsPromises.unlink(files.thumbnail[0].path).catch(() => {});
          return res.status(400).json({ message: 'File is not a valid video' });
        }
        const thumbType = await fileTypeFromFile(files.thumbnail[0].path);
        if (!thumbType || !allowedImageMimeTypes.includes(thumbType.mime)) {
          await fsPromises.unlink(files.video[0].path);
          await fsPromises.unlink(files.thumbnail[0].path);
          return res.status(400).json({ message: 'Thumbnail is not a valid image' });
        }
        next();
      } catch (err) {
        next(err);
      }
    },
  ];
}