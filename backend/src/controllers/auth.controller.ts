import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { setCache, getCache, deleteCache } from '../config/redis';
import { hashPassword, verifyPassword, generateOTP, generateSecureToken, hashToken } from '../utils/encryption';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';
import { registerSchema, loginSchema } from '../utils/validators';
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from '../utils/email';
import { getFirebaseAuth, initializeFirebase } from '../config/firebase';
import { AuthRequest } from '../middleware/auth.middleware';

initializeFirebase();

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = registerSchema.parse(req.body);

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { username: data.username },
          ...(data.phone ? [{ phone: data.phone }] : []),
        ],
      },
    });

    if (existing) {
      if (existing.email === data.email) return res.status(409).json({ success: false, error: 'Email already in use' });
      if (existing.username === data.username) return res.status(409).json({ success: false, error: 'Username taken' });
      return res.status(409).json({ success: false, error: 'Phone number already in use' });
    }

    const passwordHash = await hashPassword(data.password);
    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        phone: data.phone,
        displayName: data.displayName,
        passwordHash,
      },
      select: { id: true, username: true, email: true, displayName: true, role: true },
    });

    // Email verification OTP
    if (data.email) {
      const otp = generateOTP(6);
      await setCache(`verify:email:${user.id}`, otp, 86400);
      await sendVerificationEmail(data.email, otp);
    }

    await sendWelcomeEmail(data.email || '', data.displayName);
    const tokens = generateTokens(user.id, user.role);

    res.status(201).json({ success: true, data: { user, ...tokens } });
  } catch (err) { next(err); }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findFirst({
      where: data.email ? { email: data.email } : { phone: data.phone },
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const valid = await verifyPassword(data.password, user.passwordHash);
    if (!valid) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    if (user.isBanned) return res.status(403).json({ success: false, error: 'Account suspended' });

    if (user.twoFactorEnabled) {
      const tempToken = generateSecureToken();
      await setCache(`2fa:temp:${tempToken}`, user.id, 300);
      return res.json({ success: true, data: { requiresTwoFactor: true, tempToken } });
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastSeen: new Date(), isOnline: true } });
    const tokens = generateTokens(user.id, user.role);
    const { passwordHash: _, twoFactorSecret: __, ...safeUser } = user;

    res.json({ success: true, data: { user: safeUser, ...tokens } });
  } catch (err) { next(err); }
};

export const firebaseLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ success: false, error: 'Firebase ID token required' });

    const decoded = await getFirebaseAuth().verifyIdToken(idToken);

    let user = await prisma.user.findFirst({
      where: { OR: [{ firebaseUid: decoded.uid }, { email: decoded.email }] },
    });

    if (!user) {
      const baseUsername = (decoded.email?.split('@')[0] || decoded.uid.slice(0, 8)).replace(/[^a-zA-Z0-9_]/g, '_');
      let username = baseUsername;
      let count = 0;
      while (await prisma.user.findUnique({ where: { username } })) {
        username = `${baseUsername}${++count}`;
      }

      user = await prisma.user.create({
        data: {
          firebaseUid: decoded.uid,
          email: decoded.email,
          username,
          displayName: decoded.name || username,
          avatarUrl: decoded.picture,
          isVerified: decoded.email_verified || false,
          emailVerifiedAt: decoded.email_verified ? new Date() : null,
        },
      });

      if (decoded.email) await sendWelcomeEmail(decoded.email, user.displayName);
    } else if (!user.firebaseUid) {
      await prisma.user.update({ where: { id: user.id }, data: { firebaseUid: decoded.uid } });
    }

    if (user.isBanned) return res.status(403).json({ success: false, error: 'Account suspended' });

    await prisma.user.update({ where: { id: user.id }, data: { lastSeen: new Date(), isOnline: true } });
    const tokens = generateTokens(user.id, user.role);
    const { passwordHash: _, twoFactorSecret: __, ...safeUser } = user;

    res.json({ success: true, data: { user: safeUser, ...tokens } });
  } catch (err) { next(err); }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return res.status(400).json({ success: false, error: 'Refresh token required' });

    const blacklisted = await getCache(`blacklist:${token}`);
    if (blacklisted) return res.status(401).json({ success: false, error: 'Token revoked' });

    const { userId } = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true, isBanned: true } });

    if (!user || user.isBanned) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const tokens = generateTokens(user.id, user.role);
    // Blacklist old refresh token
    await setCache(`blacklist:${token}`, '1', 30 * 24 * 3600);

    res.json({ success: true, data: tokens });
  } catch (err) { next(err); }
};

export const logout = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { refreshToken: token } = req.body;
    if (token) await setCache(`blacklist:${token}`, '1', 30 * 24 * 3600);

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const accessToken = authHeader.split(' ')[1];
      await setCache(`blacklist:${accessToken}`, '1', 900);
    }

    if (req.user) {
      await prisma.user.update({ where: { id: req.user.id }, data: { isOnline: false, lastSeen: new Date() } });
    }

    res.json({ success: true, data: { message: 'Logged out successfully' } });
  } catch (err) { next(err); }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.json({ success: true, data: { message: 'If that email exists, a reset link was sent' } });

    const token = generateSecureToken();
    const hashedToken = hashToken(token);
    await setCache(`reset:${hashedToken}`, user.id, 3600);

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    await sendPasswordResetEmail(email, resetUrl);

    res.json({ success: true, data: { message: 'Password reset email sent' } });
  } catch (err) { next(err); }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ success: false, error: 'Token and password required' });

    const hashedToken = hashToken(token);
    const userId = await getCache(`reset:${hashedToken}`);
    if (!userId) return res.status(400).json({ success: false, error: 'Invalid or expired reset token' });

    const passwordHash = await hashPassword(password);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    await deleteCache(`reset:${hashedToken}`);

    res.json({ success: true, data: { message: 'Password reset successfully' } });
  } catch (err) { next(err); }
};

export const verifyEmail = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { code } = req.body;
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const stored = await getCache(`verify:email:${req.user.id}`);
    if (!stored || stored !== code) return res.status(400).json({ success: false, error: 'Invalid or expired code' });

    await prisma.user.update({
      where: { id: req.user.id },
      data: { isVerified: true, emailVerifiedAt: new Date() },
    });
    await deleteCache(`verify:email:${req.user.id}`);

    res.json({ success: true, data: { message: 'Email verified successfully' } });
  } catch (err) { next(err); }
};

export const verify2FA = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tempToken, code } = req.body;
    if (!tempToken || !code) return res.status(400).json({ success: false, error: 'Temp token and code required' });

    const userId = await getCache(`2fa:temp:${tempToken}`);
    if (!userId) return res.status(400).json({ success: false, error: 'Invalid or expired session' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.twoFactorSecret) return res.status(400).json({ success: false, error: '2FA not configured' });

    // Simple TOTP check (in production use speakeasy/otpauth)
    // For now: verify the code stored temporarily
    const storedCode = await getCache(`2fa:code:${userId}`);
    if (storedCode !== code) return res.status(400).json({ success: false, error: 'Invalid 2FA code' });

    await deleteCache(`2fa:temp:${tempToken}`);
    await deleteCache(`2fa:code:${userId}`);
    await prisma.user.update({ where: { id: userId }, data: { lastSeen: new Date(), isOnline: true } });

    const tokens = generateTokens(user.id, user.role);
    const { passwordHash: _, twoFactorSecret: __, ...safeUser } = user;

    res.json({ success: true, data: { user: safeUser, ...tokens } });
  } catch (err) { next(err); }
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { socialLinks: true },
      omit: { passwordHash: true, twoFactorSecret: true },
    });

    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: { user } });
  } catch (err) { next(err); }
};
