import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { createConversationSchema } from '../utils/validators';

const PARTICIPANT_SELECT = {
  id: true, userId: true, role: true, mutedUntil: true, lastReadAt: true, joinedAt: true,
  user: { select: { id: true, username: true, displayName: true, avatarUrl: true, isOnline: true, isVerified: true } },
};

const LAST_MESSAGE_SELECT = {
  id: true, type: true, content: true, mediaUrl: true, createdAt: true, isDeleted: true,
  sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
};

export const listConversations = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const participants = await prisma.conversationParticipant.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            participants: { include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true, isOnline: true, isVerified: true } } } },
            messages: { orderBy: { createdAt: 'desc' }, take: 1, select: LAST_MESSAGE_SELECT },
          },
        },
      },
      orderBy: { conversation: { lastMessageAt: 'desc' } },
    });

    const conversations = participants.map(p => {
      const conv = p.conversation;
      const unreadCount = (conv.messages[0]?.createdAt && p.lastReadAt)
        ? 0 // simplified; count would need a separate query
        : 0;
      const otherParticipant = conv.type === 'DIRECT'
        ? conv.participants.find(cp => cp.userId !== userId)?.user
        : null;

      return {
        ...conv,
        lastMessage: conv.messages[0] || null,
        unreadCount,
        otherParticipant,
        myRole: p.role,
        mutedUntil: p.mutedUntil,
        lastReadAt: p.lastReadAt,
      };
    });

    res.json({ success: true, data: { conversations } });
  } catch (err) { next(err); }
};

export const createConversation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createConversationSchema.parse(req.body);
    const userId = req.user!.id;
    const allParticipantIds = [...new Set([userId, ...data.participantIds])];

    if (data.type === 'DIRECT') {
      if (data.participantIds.length !== 1) return res.status(400).json({ success: false, error: 'Direct conversation must have exactly 1 other participant' });

      const otherId = data.participantIds[0];
      // Check if direct conversation already exists
      const existing = await prisma.conversation.findFirst({
        where: {
          type: 'DIRECT',
          AND: [
            { participants: { some: { userId } } },
            { participants: { some: { userId: otherId } } },
          ],
        },
        include: { participants: { include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true, isOnline: true } } } } },
      });

      if (existing) return res.json({ success: true, data: { conversation: existing } });
    }

    const conversation = await prisma.conversation.create({
      data: {
        type: data.type,
        name: data.name,
        description: data.description,
        createdById: userId,
        participants: {
          create: allParticipantIds.map(pid => ({
            userId: pid,
            role: pid === userId ? 'OWNER' : 'MEMBER',
          })),
        },
      },
      include: { participants: { include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true, isOnline: true } } } } },
    });

    res.status(201).json({ success: true, data: { conversation } });
  } catch (err) { next(err); }
};

export const getConversation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: id, userId } },
    });
    if (!participant) return res.status(403).json({ success: false, error: 'Not a participant' });

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        participants: { select: PARTICIPANT_SELECT },
        messages: { orderBy: { createdAt: 'desc' }, take: 50, include: { sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } } } },
      },
    });

    res.json({ success: true, data: { conversation } });
  } catch (err) { next(err); }
};

export const updateConversation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, description, avatarUrl } = req.body;
    const userId = req.user!.id;

    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: id, userId } },
    });
    if (!participant || !['OWNER', 'ADMIN'].includes(participant.role)) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const conversation = await prisma.conversation.update({ where: { id }, data: { name, description, avatarUrl } });
    res.json({ success: true, data: { conversation } });
  } catch (err) { next(err); }
};

export const addParticipants = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { userIds } = req.body;
    if (!Array.isArray(userIds)) return res.status(400).json({ success: false, error: 'userIds must be an array' });

    await prisma.conversationParticipant.createMany({
      data: userIds.map((uid: string) => ({ conversationId: id, userId: uid, role: 'MEMBER' })),
      skipDuplicates: true,
    });

    res.json({ success: true, data: { message: 'Participants added' } });
  } catch (err) { next(err); }
};

export const removeParticipant = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id, userId: targetUserId } = req.params;
    await prisma.conversationParticipant.delete({
      where: { conversationId_userId: { conversationId: id, userId: targetUserId } },
    });
    res.json({ success: true, data: { message: 'Participant removed' } });
  } catch (err) { next(err); }
};

export const muteConversation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { mutedUntil } = req.body;
    await prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId: id, userId: req.user!.id } },
      data: { mutedUntil: mutedUntil ? new Date(mutedUntil) : null },
    });
    res.json({ success: true, data: { message: mutedUntil ? 'Conversation muted' : 'Conversation unmuted' } });
  } catch (err) { next(err); }
};
