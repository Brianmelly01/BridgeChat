import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { uploadLimiter } from '../middleware/rateLimit.middleware';
import { upload } from '../middleware/upload.middleware';
import { uploadFile, deleteFile, generateUniqueKey, getFileCategory } from '../services/s3.service';

const router = Router();

router.post('/upload', authenticate, uploadLimiter, upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file provided' });
    const folder = getFileCategory(req.file.mimetype);
    const key = generateUniqueKey(folder, req.file.originalname);
    const url = await uploadFile(req.file.buffer, key, req.file.mimetype);
    res.json({ success: true, data: { url, key, mimeType: req.file.mimetype, size: req.file.size, name: req.file.originalname } });
  } catch (err) { next(err); }
});

router.delete('/:key', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await deleteFile(req.params.key);
    res.json({ success: true, data: { message: 'File deleted' } });
  } catch (err) { next(err); }
});

export default router;
