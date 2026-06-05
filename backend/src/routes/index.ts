import { Router } from 'express';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import conversationsRoutes from './conversations.routes';
import messagesRoutes from './messages.routes';
import groupsRoutes from './groups.routes';
import discoveryRoutes from './discovery.routes';
import callsRoutes from './calls.routes';
import notificationsRoutes from './notifications.routes';
import adminRoutes from './admin.routes';
import mediaRoutes from './media.routes';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.use('/auth', authRoutes);

// Protected routes
router.use('/users', authMiddleware, usersRoutes);
router.use('/conversations', authMiddleware, conversationsRoutes);
router.use('/messages', authMiddleware, messagesRoutes);
router.use('/groups', authMiddleware, groupsRoutes);
router.use('/discovery', authMiddleware, discoveryRoutes);
router.use('/calls', authMiddleware, callsRoutes);
router.use('/notifications', authMiddleware, notificationsRoutes);
router.use('/media', authMiddleware, mediaRoutes);
router.use('/admin', authMiddleware, adminRoutes);

export default router;
