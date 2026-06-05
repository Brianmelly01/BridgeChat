import multer from 'multer';
import path from 'path';
import { Request } from 'express';

const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  video: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'],
  audio: ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/mp4', 'audio/aac', 'audio/webm'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
};

const ALL_ALLOWED = Object.values(ALLOWED_MIME_TYPES).flat();

const fileFilter = (allowed: string[]) => (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error(`File type ${file.mimetype} not allowed`));
};

const storage = multer.memoryStorage();

// General file upload (all types, 100MB)
export const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024, files: 10 },
  fileFilter: fileFilter(ALL_ALLOWED),
});

// Image only
export const uploadImage = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: fileFilter(ALLOWED_MIME_TYPES.image),
});

// Avatar upload (5MB max)
export const uploadAvatar = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter(ALLOWED_MIME_TYPES.image),
});
