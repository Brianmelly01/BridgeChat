import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getNearbyUsers, getOnlineUsers, generateQRToken, resolveQRToken } from '../controllers/discovery.controller';

const router = Router();
router.use(authenticate);
router.get('/nearby', getNearbyUsers);
router.get('/online', getOnlineUsers);
router.post('/qr-token', generateQRToken);
router.get('/qr-token/:token', resolveQRToken);

export default router;
