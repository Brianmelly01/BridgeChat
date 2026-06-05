import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { getStats, getUsers, banUser, unbanUser, getReports, updateReport, getCommunities, deleteCommunity } from '../controllers/admin.controller';

const router = Router();
router.use(authenticate, requireAdmin);
router.get('/stats', getStats);
router.get('/users', getUsers);
router.put('/users/:id/ban', banUser);
router.put('/users/:id/unban', unbanUser);
router.get('/reports', getReports);
router.put('/reports/:id', updateReport);
router.get('/communities', getCommunities);
router.delete('/communities/:id', deleteCommunity);

export default router;
