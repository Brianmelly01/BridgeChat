import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { uploadSingle } from '../middleware/upload.middleware';
import { messageLimiter } from '../middleware/rateLimit.middleware';
import { getMessages, sendMessage, editMessage, deleteMessage, reactToMessage, markAsRead } from '../controllers/messages.controller';

const router = Router();

router.use(authenticate);
router.get('/:conversationId', getMessages);
router.post('/', messageLimiter, uploadSingle, sendMessage);
router.put('/:id', editMessage);
router.delete('/:id', deleteMessage);
router.post('/:id/react', reactToMessage);
router.put('/:conversationId/read', markAsRead);

export default router;
