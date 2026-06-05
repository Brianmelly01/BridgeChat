import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';

export const getNotifications = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { limit = '30', cursor } = req.query;
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      take: Number(limit),
      ...(cursor ? { skip: 1, cursor: { id: String(cursor) } } : {}),
      orderBy: { createdAt: 'desc' },
    });
    const unreadCount = await prisma.notification.count({ where: { userId: req.user!.id, isRead: false } });
    res.json({ success: true, data: { notifications, unreadCount, nextCursor: notifications.length === Number(limit) ? notifications[notifications.length - 1].id : null } });
  } catch (err) { next(err); }
};

export const markNotificationRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.update({ where: { id: req.params.id, userId: req.user!.id }, data: { isRead: true } });
    res.json({ success: true, data: { message: 'Marked as read' } });
  } catch (err) { next(err); }
};

export const markAllRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.updateMany({ where: { userId: req.user!.id, isRead: false }, data: { isRead: true } });
    res.json({ success: true, data: { message: 'All notifications marked as read' } });
  } catch (err) { next(err); }
};

export const deleteNotification = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.delete({ where: { id: req.params.id, userId: req.user!.id } });
    res.json({ success: true, data: { message: 'Notification deleted' } });
  } catch (err) { next(err); }
};
