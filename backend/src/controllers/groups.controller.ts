import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { createGroupSchema } from '../utils/validators';
import { uploadFile } from '../services/s3.service';
import { v4 as uuidv4 } from 'uuid';

export const getPublicGroups = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { q, limit = '20', cursor } = req.query;
    const groups = await prisma.group.findMany({
      where: {
        isPublic: true,
        ...(q ? { name: { contains: String(q), mode: 'insensitive' } } : {}),
      },
      take: Number(limit),
      ...(cursor ? { skip: 1, cursor: { id: String(cursor) } } : {}),
      include: { owner: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
      orderBy: { memberCount: 'desc' },
    });
    res.json({ success: true, data: { groups, nextCursor: groups.length === Number(limit) ? groups[groups.length - 1].id : null } });
  } catch (err) { next(err); }
};

export const getGroupById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const group = await prisma.group.findUnique({
      where: { id: req.params.id },
      include: {
        owner: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        members: {
          include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true, isOnline: true } } },
          orderBy: { joinedAt: 'asc' }, take: 50,
        },
      },
    });
    if (!group) return res.status(404).json({ success: false, error: 'Group not found' });
    res.json({ success: true, data: { group } });
  } catch (err) { next(err); }
};

export const createGroup = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createGroupSchema.parse(req.body);
    const userId = req.user!.id;
    let avatarUrl: string | undefined;

    if (req.file) {
      avatarUrl = await uploadFile(req.file.buffer, `groups/${uuidv4()}`, req.file.mimetype);
    }

    const group = await prisma.group.create({
      data: {
        name: data.name,
        description: data.description,
        isPublic: data.isPublic,
        ownerId: userId,
        avatarUrl,
        memberCount: data.memberIds.length + 1,
        members: {
          create: [
            { userId, role: 'OWNER' },
            ...data.memberIds.map(id => ({ userId: id, role: 'MEMBER' as const })),
          ],
        },
      },
      include: { owner: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
    });

    res.status(201).json({ success: true, data: { group } });
  } catch (err) { next(err); }
};

export const updateGroup = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const member = await prisma.groupMember.findUnique({ where: { groupId_userId: { groupId: id, userId } } });
    if (!member || !['OWNER', 'ADMIN'].includes(member.role)) return res.status(403).json({ success: false, error: 'Not authorized' });

    let avatarUrl: string | undefined;
    if (req.file) avatarUrl = await uploadFile(req.file.buffer, `groups/${uuidv4()}`, req.file.mimetype);

    const group = await prisma.group.update({
      where: { id },
      data: { ...req.body, ...(avatarUrl ? { avatarUrl } : {}) },
    });
    res.json({ success: true, data: { group } });
  } catch (err) { next(err); }
};

export const deleteGroup = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const group = await prisma.group.findUnique({ where: { id } });
    if (!group) return res.status(404).json({ success: false, error: 'Group not found' });
    if (group.ownerId !== req.user!.id) return res.status(403).json({ success: false, error: 'Only the owner can delete the group' });
    await prisma.group.delete({ where: { id } });
    res.json({ success: true, data: { message: 'Group deleted' } });
  } catch (err) { next(err); }
};

export const joinGroup = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const group = await prisma.group.findUnique({ where: { id } });
    if (!group) return res.status(404).json({ success: false, error: 'Group not found' });
    if (!group.isPublic) return res.status(403).json({ success: false, error: 'This group is private' });

    await prisma.$transaction([
      prisma.groupMember.create({ data: { groupId: id, userId, role: 'MEMBER' } }),
      prisma.group.update({ where: { id }, data: { memberCount: { increment: 1 } } }),
    ]);
    res.json({ success: true, data: { message: 'Joined group' } });
  } catch (err) { next(err); }
};

export const leaveGroup = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const member = await prisma.groupMember.findUnique({ where: { groupId_userId: { groupId: id, userId } } });
    if (!member) return res.status(404).json({ success: false, error: 'Not a member' });

    if (member.role === 'OWNER') {
      const nextAdmin = await prisma.groupMember.findFirst({
        where: { groupId: id, userId: { not: userId }, role: 'ADMIN' },
        orderBy: { joinedAt: 'asc' },
      }) || await prisma.groupMember.findFirst({
        where: { groupId: id, userId: { not: userId } },
        orderBy: { joinedAt: 'asc' },
      });

      if (nextAdmin) {
        await prisma.$transaction([
          prisma.groupMember.update({ where: { id: nextAdmin.id }, data: { role: 'OWNER' } }),
          prisma.group.update({ where: { id }, data: { ownerId: nextAdmin.userId } }),
        ]);
      } else {
        await prisma.group.delete({ where: { id } });
        return res.json({ success: true, data: { message: 'Left and deleted empty group' } });
      }
    }

    await prisma.$transaction([
      prisma.groupMember.delete({ where: { groupId_userId: { groupId: id, userId } } }),
      prisma.group.update({ where: { id }, data: { memberCount: { decrement: 1 } } }),
    ]);
    res.json({ success: true, data: { message: 'Left group' } });
  } catch (err) { next(err); }
};

export const getGroupMembers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { limit = '50', cursor } = req.query;
    const members = await prisma.groupMember.findMany({
      where: { groupId: id },
      take: Number(limit),
      ...(cursor ? { skip: 1, cursor: { id: String(cursor) } } : {}),
      include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true, isOnline: true } } },
      orderBy: { joinedAt: 'asc' },
    });
    res.json({ success: true, data: { members, nextCursor: members.length === Number(limit) ? members[members.length - 1].id : null } });
  } catch (err) { next(err); }
};

export const updateMemberRole = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id, userId: targetUserId } = req.params;
    const { role } = req.body;
    const requesterId = req.user!.id;
    const requester = await prisma.groupMember.findUnique({ where: { groupId_userId: { groupId: id, userId: requesterId } } });
    if (!requester || requester.role !== 'OWNER') return res.status(403).json({ success: false, error: 'Only the owner can change roles' });
    await prisma.groupMember.update({ where: { groupId_userId: { groupId: id, userId: targetUserId } }, data: { role } });
    res.json({ success: true, data: { message: 'Role updated' } });
  } catch (err) { next(err); }
};

export const removeMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id, userId: targetUserId } = req.params;
    const requesterId = req.user!.id;
    const requester = await prisma.groupMember.findUnique({ where: { groupId_userId: { groupId: id, userId: requesterId } } });
    if (!requester || !['OWNER', 'ADMIN'].includes(requester.role)) return res.status(403).json({ success: false, error: 'Not authorized' });
    await prisma.$transaction([
      prisma.groupMember.delete({ where: { groupId_userId: { groupId: id, userId: targetUserId } } }),
      prisma.group.update({ where: { id }, data: { memberCount: { decrement: 1 } } }),
    ]);
    res.json({ success: true, data: { message: 'Member removed' } });
  } catch (err) { next(err); }
};
