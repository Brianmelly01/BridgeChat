import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';

export const getStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [totalUsers, activeUsers, totalMessages, todayMessages, todayUsers, pendingReports] = await Promise.all([
      prisma.user.count({ where: { isBanned: false } }),
      prisma.user.count({ where: { isOnline: true } }),
      prisma.message.count({ where: { isDeleted: false } }),
      prisma.message.count({ where: { createdAt: { gte: today }, isDeleted: false } }),
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.report.count({ where: { status: 'PENDING' } }),
    ]);
    res.json({ success: true, data: { totalUsers, activeUsers, totalMessages, todayMessages, todayUsers, pendingReports } });
  } catch (err) { next(err); }
};

export const getUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { q, role, isBanned, page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (q) where.OR = [{ email: { contains: String(q), mode: 'insensitive' } }, { username: { contains: String(q), mode: 'insensitive' } }, { displayName: { contains: String(q), mode: 'insensitive' } }];
    if (role) where.role = String(role);
    if (isBanned !== undefined) where.isBanned = isBanned === 'true';

    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' }, omit: { passwordHash: true, twoFactorSecret: true } }),
      prisma.user.count({ where }),
    ]);
    res.json({ success: true, data: { users, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) } });
  } catch (err) { next(err); }
};

export const banUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.user.update({ where: { id: req.params.id }, data: { isBanned: true } });
    res.json({ success: true, data: { message: 'User banned' } });
  } catch (err) { next(err); }
};

export const unbanUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.user.update({ where: { id: req.params.id }, data: { isBanned: false } });
    res.json({ success: true, data: { message: 'User unbanned' } });
  } catch (err) { next(err); }
};

export const getReports = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (status) where.status = String(status);
    const [reports, total] = await Promise.all([
      prisma.report.findMany({ where, skip, take: Number(limit), include: { reporter: { select: { id: true, username: true, displayName: true, avatarUrl: true } }, target: { select: { id: true, username: true, displayName: true, avatarUrl: true } } }, orderBy: { createdAt: 'desc' } }),
      prisma.report.count({ where }),
    ]);
    res.json({ success: true, data: { reports, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) } });
  } catch (err) { next(err); }
};

export const updateReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, adminNote } = req.body;
    const report = await prisma.report.update({ where: { id: req.params.id }, data: { status, adminNote } });
    res.json({ success: true, data: { report } });
  } catch (err) { next(err); }
};

export const getCommunities = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [groups, total] = await Promise.all([
      prisma.group.findMany({ skip, take: Number(limit), include: { owner: { select: { id: true, username: true, displayName: true } } }, orderBy: { memberCount: 'desc' } }),
      prisma.group.count(),
    ]);
    res.json({ success: true, data: { groups, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) } });
  } catch (err) { next(err); }
};

export const deleteCommunity = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.group.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: { message: 'Community deleted' } });
  } catch (err) { next(err); }
};
