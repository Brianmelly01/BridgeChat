import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authLimiter } from '../middleware/rateLimit.middleware';
import { register, login, firebaseLogin, refreshToken, logout, forgotPassword, resetPassword, verifyEmail, verify2FA, getMe } from '../controllers/auth.controller';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/firebase-login', authLimiter, firebaseLogin);
router.post('/refresh-token', refreshToken);
router.post('/logout', authenticate, logout);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-email', authenticate, verifyEmail);
router.post('/verify-2fa', verify2FA);
router.get('/me', authenticate, getMe);

export default router;
