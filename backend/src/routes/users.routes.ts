import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { uploadAvatar } from '../middleware/upload.middleware';
import { searchUsers, getUserById, updateProfile, followUser, unfollowUser, getFollowers, getFollowing, blockUser, unblockUser, getBlockedUsers, reportUser, updateSocialLinks, updateFcmToken, deleteAccount } from '../controllers/users.controller';

const router = Router();

router.use(authenticate);
router.get('/search', searchUsers);
router.get('/blocked', getBlockedUsers);
router.put('/profile', uploadAvatar, updateProfile);
router.put('/social-links', updateSocialLinks);
router.put('/fcm-token', updateFcmToken);
router.delete('/account', deleteAccount);
router.get('/:id', getUserById);
router.post('/:id/follow', followUser);
router.delete('/:id/follow', unfollowUser);
router.get('/:id/followers', getFollowers);
router.get('/:id/following', getFollowing);
router.post('/:id/block', blockUser);
router.delete('/:id/block', unblockUser);
router.post('/:id/report', reportUser);

export default router;
