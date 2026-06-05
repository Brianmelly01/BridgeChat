import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { listConversations, createConversation, getConversation, updateConversation, addParticipants, removeParticipant, muteConversation } from '../controllers/conversations.controller';

const router = Router();

router.use(authenticate);
router.get('/', listConversations);
router.post('/', createConversation);
router.get('/:id', getConversation);
router.put('/:id', updateConversation);
router.post('/:id/participants', addParticipants);
router.delete('/:id/participants/:userId', removeParticipant);
router.put('/:id/mute', muteConversation);

export default router;
