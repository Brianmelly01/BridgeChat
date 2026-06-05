import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { initiateCall, acceptCall, rejectCall, endCall, getCallHistory } from '../controllers/calls.controller';

const router = Router();
router.use(authenticate);
router.post('/initiate', initiateCall);
router.put('/:id/accept', acceptCall);
router.put('/:id/reject', rejectCall);
router.put('/:id/end', endCall);
router.get('/history', getCallHistory);

export default router;
