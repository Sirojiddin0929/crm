import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';

const sharedStorage = diskStorage({
  destination: './uploads',
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
  },
});

export const multerConfig = {
  storage: sharedStorage,
  fileFilter: (_req: any, file: Express.Multer.File, cb: any) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    if (!allowed.includes(extname(file.originalname).toLowerCase())) {
      return cb(
        new BadRequestException('Faqat jpg, jpeg, png, webp formatlar qabul qilinadi'),
        false,
      );
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
};

export const videoMulterConfig = {
  storage: sharedStorage,
  fileFilter: (_req: any, file: Express.Multer.File, cb: any) => {
    const allowed = ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv', '.wmv', '.m4v'];
    if (!allowed.includes(extname(file.originalname).toLowerCase())) {
      return cb(
        new BadRequestException('Faqat mp4, avi, mov, mkv, webm formatlar qabul qilinadi'),
        false,
      );
    }
    cb(null, true);
  },
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
};

export const documentMulterConfig = {
  storage: sharedStorage,
  fileFilter: (_req: any, file: Express.Multer.File, cb: any) => {
    const allowed = [
      '.jpg', '.jpeg', '.png', '.webp', 
      '.pdf', '.doc', '.docx', '.ppt', '.pptx', 
      '.xls', '.xlsx', '.zip', '.rar', '.txt', '.csv'
    ];
    if (!allowed.includes(extname(file.originalname).toLowerCase())) {
      return cb(
        new BadRequestException('Faqat rasm, pdf, word, excel, ppt, va arxiv (zip/rar) fayllar qabul qilinadi'),
        false,
      );
    }
    cb(null, true);
  },
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
};
