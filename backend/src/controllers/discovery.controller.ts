import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { setCache, getCache } from '../config/redis';
import { generateSecureToken } from '../utils/encryption';

const EARTH_RADIUS_KM = 6371;

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const getNearbyUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { lat, lng, radius = '5' } = req.query;
    if (!lat || !lng) return res.status(400).json({ success: false, error: 'lat and lng are required' });

    const userLat = parseFloat(String(lat));
    const userLng = parseFloat(String(lng));
    const maxRadius = parseFloat(String(radius));
    const userId = req.user!.id;

    const users = await prisma.user.findMany({
      where: {
        id: { not: userId },
        isPrivate: false,
        isBanned: false,
        isOnline: true,
        latitude: { not: null },
        longitude: { not: null },
      },
      select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true, isOnline: true, latitude: true, longitude: true, bio: true },
    });

    const nearby = users
      .map(u => ({ ...u, distance: haversineDistance(userLat, userLng, u.latitude!, u.longitude!) }))
      .filter(u => u.distance <= maxRadius)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 50);

    res.json({ success: true, data: { users: nearby } });
  } catch (err) { next(err); }
};

export const getOnlineUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const blocked = await prisma.block.findMany({
      where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
      select: { blockerId: true, blockedId: true },
    });
    const blockedIds = blocked.map(b => b.blockerId === userId ? b.blockedId : b.blockerId);

    const users = await prisma.user.findMany({
      where: { id: { notIn: [...blockedIds, userId] }, isOnline: true, isPrivate: false, isBanned: false },
      select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true, isOnline: true, lastSeen: true },
      take: 50,
      orderBy: { lastSeen: 'desc' },
    });

    res.json({ success: true, data: { users } });
  } catch (err) { next(err); }
};

export const generateQRToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = generateSecureToken();
    await setCache(`qr:${token}`, req.user!.id, 300); // 5 min TTL
    res.json({ success: true, data: { token, expiresIn: 300 } });
  } catch (err) { next(err); }
};

export const resolveQRToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;
    const userId = await getCache(`qr:${token}`);
    if (!userId) return res.status(404).json({ success: false, error: 'QR code expired or invalid' });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true, bio: true, isPrivate: true },
    });

    res.json({ success: true, data: { user } });
  } catch (err) { next(err); }
};
