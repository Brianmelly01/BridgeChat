import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';
import { getPublicGroups, getGroupById, createGroup, updateGroup, deleteGroup, joinGroup, leaveGroup, getGroupMembers, updateMemberRole, removeMember } from '../controllers/groups.controller';

const router = Router();

router.use(authenticate);
router.get('/', getPublicGroups);
router.post('/', upload.single('avatar'), createGroup);
router.get('/:id', getGroupById);
router.put('/:id', upload.single('avatar'), updateGroup);
router.delete('/:id', deleteGroup);
router.post('/:id/join', joinGroup);
router.delete('/:id/leave', leaveGroup);
router.get('/:id/members', getGroupMembers);
router.put('/:id/members/:userId/role', updateMemberRole);
router.delete('/:id/members/:userId', removeMember);

export default router;
