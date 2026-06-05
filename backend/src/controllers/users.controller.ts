import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { updateProfileSchema, socialLinksSchema, paginationSchema, reportSchema } from '../utils/validators';
import { uploadAvatar } from '../middleware/upload.middleware';
import { uploadFile } from '../services/s3.service';
import { createAndSendNotification } from '../services/notification.service';

export const searchUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { q, limit = 20, cursor } = req.query;
    if (!q) return res.status(400).json({ success: false, error: 'Search query required' });

    const blocked = req.user ? await prisma.block.findMany({
      where: { OR: [{ blockerId: req.user.id }, { blockedId: req.user.id }] },
      select: { blockerId: true, blockedId: true },
    }) : [];
    const blockedIds = blocked.map(b => b.blockerId === req.user?.id ? b.blockedId : b.blockerId);

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { notIn: [...blockedIds, req.user?.id].filter(Boolean) as string[] } },
          { isBanned: false },
          {
            OR: [
              { username: { contains: String(q), mode: 'insensitive' } },
              { displayName: { contains: String(q), mode: 'insensitive' } },
            ],
          },
        ],
      },
      take: Number(limit),
      ...(cursor ? { skip: 1, cursor: { id: String(cursor) } } : {}),
      select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true, isOnline: true, isPrivate: true, bio: true },
      orderBy: { displayName: 'asc' },
    });

    res.json({ success: true, data: { users, nextCursor: users.length === Number(limit) ? users[users.length - 1].id : null } });
  } catch (err) { next(err); }
};

export const getUserById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;

    if (currentUserId) {
      const block = await prisma.block.findFirst({
        where: { OR: [{ blockerId: currentUserId, blockedId: id }, { blockerId: id, blockedId: currentUserId }] },
      });
      if (block) return res.status(404).json({ success: false, error: 'User not found' });
    }

    const user = await prisma.user.findUnique({
      where: { id, isBanned: false },
      include: {
        socialLinks: true,
        _count: { select: { followers: { where: { status: 'ACCEPTED' } }, following: { where: { status: 'ACCEPTED' } } } },
      },
      omit: { passwordHash: true, twoFactorSecret: true, fcmToken: true },
    });

    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    let isFollowing = false, isFollowedBy = false;
    if (currentUserId) {
      const [fwd, rev] = await Promise.all([
        prisma.follow.findUnique({ where: { followerId_followingId: { followerId: currentUserId, followingId: id } } }),
        prisma.follow.findUnique({ where: { followerId_followingId: { followerId: id, followingId: currentUserId } } }),
      ]);
      isFollowing = fwd?.status === 'ACCEPTED';
      isFollowedBy = rev?.status === 'ACCEPTED';

      if (user.isPrivate && !isFollowing && currentUserId !== id) {
        return res.json({ success: true, data: { user: { id: user.id, username: user.username, displayName: user.displayName, avatarUrl: user.avatarUrl, isPrivate: true, isVerified: user.isVerified, _count: user._count }, isFollowing, isFollowedBy } });
      }
    }

    res.json({ success: true, data: { user, isFollowing, isFollowedBy } });
  } catch (err) { next(err); }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = updateProfileSchema.parse(req.body);
    let avatarUrl: string | undefined;

    if (req.file) {
      avatarUrl = await uploadFile(req.file.buffer, `avatars/${req.user!.id}`, req.file.mimetype);
    }

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { ...data, ...(avatarUrl ? { avatarUrl } : {}) },
      omit: { passwordHash: true, twoFactorSecret: true },
    });

    res.json({ success: true, data: { user } });
  } catch (err) { next(err); }
};

export const followUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id: targetId } = req.params;
    const followerId = req.user!.id;

    if (followerId === targetId) return res.status(400).json({ success: false, error: 'Cannot follow yourself' });

    const target = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true, isPrivate: true, displayName: true } });
    if (!target) return res.status(404).json({ success: false, error: 'User not found' });

    const existing = await prisma.follow.findUnique({ where: { followerId_followingId: { followerId, followingId: targetId } } });
    if (existing) return res.status(409).json({ success: false, error: 'Already following' });

    const status = target.isPrivate ? 'PENDING' : 'ACCEPTED';
    const follow = await prisma.follow.create({ data: { followerId, followingId: targetId, status } });

    await createAndSendNotification(
      targetId,
      target.isPrivate ? 'FOLLOW_REQUEST' : 'NEW_FOLLOWER',
      target.isPrivate ? 'New follow request' : 'New follower',
      `${req.user!.username} ${target.isPrivate ? 'wants to follow you' : 'started following you'}`,
      { followerId }
    );

    res.json({ success: true, data: { follow } });
  } catch (err) { next(err); }
};

export const unfollowUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id: targetId } = req.params;
    await prisma.follow.delete({ where: { followerId_followingId: { followerId: req.user!.id, followingId: targetId } } });
    res.json({ success: true, data: { message: 'Unfollowed successfully' } });
  } catch (err) { next(err); }
};

export const getFollowers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { limit = '20', cursor } = req.query;

    const follows = await prisma.follow.findMany({
      where: { followingId: id, status: 'ACCEPTED' },
      take: Number(limit),
      ...(cursor ? { skip: 1, cursor: { id: String(cursor) } } : {}),
      include: { follower: { select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true, isOnline: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: { users: follows.map(f => f.follower), nextCursor: follows.length === Number(limit) ? follows[follows.length - 1].id : null } });
  } catch (err) { next(err); }
};

export const getFollowing = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { limit = '20', cursor } = req.query;

    const follows = await prisma.follow.findMany({
      where: { followerId: id, status: 'ACCEPTED' },
      take: Number(limit),
      ...(cursor ? { skip: 1, cursor: { id: String(cursor) } } : {}),
      include: { following: { select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true, isOnline: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: { users: follows.map(f => f.following), nextCursor: follows.length === Number(limit) ? follows[follows.length - 1].id : null } });
  } catch (err) { next(err); }
};

export const blockUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id: blockedId } = req.params;
    const blockerId = req.user!.id;

    if (blockerId === blockedId) return res.status(400).json({ success: false, error: 'Cannot block yourself' });

    await prisma.$transaction([
      prisma.block.upsert({ where: { blockerId_blockedId: { blockerId, blockedId } }, create: { blockerId, blockedId }, update: {} }),
      prisma.follow.deleteMany({ where: { OR: [{ followerId: blockerId, followingId: blockedId }, { followerId: blockedId, followingId: blockerId }] } }),
    ]);

    res.json({ success: true, data: { message: 'User blocked' } });
  } catch (err) { next(err); }
};

export const unblockUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.block.delete({ where: { blockerId_blockedId: { blockerId: req.user!.id, blockedId: req.params.id } } });
    res.json({ success: true, data: { message: 'User unblocked' } });
  } catch (err) { next(err); }
};

export const getBlockedUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const blocks = await prisma.block.findMany({
      where: { blockerId: req.user!.id },
      include: { blocked: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
    });
    res.json({ success: true, data: { users: blocks.map(b => b.blocked) } });
  } catch (err) { next(err); }
};

export const reportUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id: targetId } = req.params;
    const data = reportSchema.parse(req.body);
    const report = await prisma.report.create({
      data: { reporterId: req.user!.id, targetId, targetType: 'USER', ...data },
    });
    res.status(201).json({ success: true, data: { report } });
  } catch (err) { next(err); }
};

export const updateSocialLinks = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const links = socialLinksSchema.parse(req.body);
    await prisma.socialLink.deleteMany({ where: { userId: req.user!.id } });
    const created = await prisma.socialLink.createMany({ data: links.map(l => ({ ...l, userId: req.user!.id })) });
    res.json({ success: true, data: { created: created.count } });
  } catch (err) { next(err); }
};

export const updateFcmToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { fcmToken } = req.body;
    await prisma.user.update({ where: { id: req.user!.id }, data: { fcmToken } });
    res.json({ success: true, data: { message: 'FCM token updated' } });
  } catch (err) { next(err); }
};

export const deleteAccount = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.user.update({ where: { id: req.user!.id }, data: { isBanned: true, email: null, phone: null, passwordHash: null, displayName: '[Deleted User]', bio: null, avatarUrl: null } });
    res.json({ success: true, data: { message: 'Account deleted' } });
  } catch (err) { next(err); }
};
