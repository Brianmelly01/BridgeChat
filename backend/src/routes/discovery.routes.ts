import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getNearbyUsers, getOnlineUsers, generateQRToken, resolveQRToken, getWifiUsers, updateWifiNetwork, leaveWifiNetwork } from '../controllers/discovery.controller';

const router = Router();
router.use(authenticate);
router.get('/nearby', getNearbyUsers);
router.get('/online', getOnlineUsers);
router.get('/wifi', getWifiUsers);
router.post('/wifi/join', updateWifiNetwork);
router.post('/wifi/leave', leaveWifiNetwork);
router.post('/qr-token', generateQRToken);
router.get('/qr-token/:token', resolveQRToken);

export default router;
