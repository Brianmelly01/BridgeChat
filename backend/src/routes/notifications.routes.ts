import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getNotifications, markNotificationRead, markAllRead, deleteNotification } from '../controllers/notifications.controller';

const router = Router();
router.use(authenticate);
router.get('/', getNotifications);
router.put('/read-all', markAllRead);
router.put('/:id/read', markNotificationRead);
router.delete('/:id', deleteNotification);

export default router;
