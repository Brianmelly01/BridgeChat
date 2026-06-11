import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: string; email?: string };
    }
  }
}

export interface AuthRequest extends Request {
  user?: { id: string; role: string; email?: string };
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Authorization token required' });
    }
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, email: true, isBanned: true },
    });
    if (!user) return res.status(401).json({ success: false, error: 'User not found' });
    if (user.isBanned) return res.status(403).json({ success: false, error: 'Account suspended' });
    req.user = { id: user.id, role: user.role, email: user.email ?? undefined };
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ success: false, error: 'Token expired' });
    if (err.name === 'JsonWebTokenError') return res.status(401).json({ success: false, error: 'Invalid token' });
    next(err);
  }
};

export const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };
      const user = await prisma.user.findUnique({ where: { id: decoded.userId }, select: { id: true, role: true, email: true } });
      if (user) req.user = { id: user.id, role: user.role, email: user.email ?? undefined };
    }
  } catch { /* ignore */ }
  next();
};

export const requireRole = (...roles: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }
    next();
  };
