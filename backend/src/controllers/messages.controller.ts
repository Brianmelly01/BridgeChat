import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendMessageSchema } from '../utils/validators';
import { uploadFile, getFileCategory } from '../services/s3.service';
import { createAndSendNotification } from '../services/notification.service';
import { emitToConversation } from '../services/socket.service';
import { v4 as uuidv4 } from 'uuid';

const MESSAGE_INCLUDE = {
  sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
  replyTo: {
    select: {
      id: true, type: true, content: true, mediaUrl: true,
      sender: { select: { id: true, username: true, displayName: true } },
    },
  },
};

export const getMessages = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { conversationId } = req.params;
    const { cursor, limit = '50' } = req.query;
    const userId = req.user!.id;

    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!participant) return res.status(403).json({ success: false, error: 'Not a participant' });

    const messages = await prisma.message.findMany({
      where: { conversationId },
      take: Number(limit),
      ...(cursor ? { skip: 1, cursor: { id: String(cursor) } } : {}),
      include: MESSAGE_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: { messages: messages.reverse(), nextCursor: messages.length === Number(limit) ? messages[0]?.id : null } });
  } catch (err) { next(err); }
};

export const sendMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = sendMessageSchema.parse(req.body);
    const userId = req.user!.id;

    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: data.conversationId, userId } },
    });
    if (!participant) return res.status(403).json({ success: false, error: 'Not a participant' });

    let mediaUrl: string | undefined;
    let mediaSize: number | undefined;
    let mediaMime: string | undefined;
    let mediaName: string | undefined;
    let messageType = data.type;

    if (req.file) {
      const folder = getFileCategory(req.file.mimetype);
      const key = `${folder}/${uuidv4()}-${req.file.originalname}`;
      mediaUrl = await uploadFile(req.file.buffer, key, req.file.mimetype);
      mediaSize = req.file.size;
      mediaMime = req.file.mimetype;
      mediaName = req.file.originalname;
      if (folder === 'images') messageType = 'IMAGE';
      else if (folder === 'videos') messageType = 'VIDEO';
      else if (folder === 'audio') messageType = 'AUDIO';
      else messageType = 'DOCUMENT';
    }

    const message = await prisma.message.create({
      data: {
        conversationId: data.conversationId,
        senderId: userId,
        type: messageType,
        content: data.content,
        mediaUrl,
        mediaSize,
        mediaMime,
        mediaName,
        replyToId: data.replyToId,
        forwardedFromId: data.forwardedFromId,
      },
      include: MESSAGE_INCLUDE,
    });

    await prisma.conversation.update({
      where: { id: data.conversationId },
      data: { lastMessageAt: new Date() },
    });

    // Emit real-time event
    emitToConversation(data.conversationId, 'message:new', message);

    // Send push notifications to other participants
    const otherParticipants = await prisma.conversationParticipant.findMany({
      where: { conversationId: data.conversationId, userId: { not: userId }, mutedUntil: null },
      include: { user: { select: { id: true, displayName: true } } },
    });

    const senderName = req.user!.username;
    const preview = data.content ? data.content.slice(0, 100) : `Sent a ${messageType.toLowerCase()}`;

    for (const p of otherParticipants) {
      await createAndSendNotification(
        p.userId, 'NEW_MESSAGE', senderName,
        preview, { conversationId: data.conversationId, messageId: message.id }
      );
    }

    res.status(201).json({ success: true, data: { message } });
  } catch (err) { next(err); }
};

export const editMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user!.id;

    const msg = await prisma.message.findUnique({ where: { id } });
    if (!msg) return res.status(404).json({ success: false, error: 'Message not found' });
    if (msg.senderId !== userId) return res.status(403).json({ success: false, error: 'Cannot edit another user\'s message' });
    if (msg.isDeleted) return res.status(400).json({ success: false, error: 'Cannot edit deleted message' });

    const updated = await prisma.message.update({
      where: { id },
      data: { content, isEdited: true },
      include: MESSAGE_INCLUDE,
    });

    emitToConversation(msg.conversationId, 'message:edited', updated);
    res.json({ success: true, data: { message: updated } });
  } catch (err) { next(err); }
};

export const deleteMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const msg = await prisma.message.findUnique({ where: { id } });
    if (!msg) return res.status(404).json({ success: false, error: 'Message not found' });
    if (msg.senderId !== userId) return res.status(403).json({ success: false, error: 'Cannot delete another user\'s message' });

    const updated = await prisma.message.update({
      where: { id },
      data: { isDeleted: true, content: null, mediaUrl: null },
    });

    emitToConversation(msg.conversationId, 'message:deleted', { id, conversationId: msg.conversationId });
    res.json({ success: true, data: { message: updated } });
  } catch (err) { next(err); }
};

export const reactToMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;
    const userId = req.user!.id;

    const msg = await prisma.message.findUnique({ where: { id } });
    if (!msg) return res.status(404).json({ success: false, error: 'Message not found' });

    const reactions = (msg.reactions as Record<string, string>) || {};

    if (reactions[userId] === emoji) {
      delete reactions[userId];
    } else {
      reactions[userId] = emoji;
    }

    const updated = await prisma.message.update({ where: { id }, data: { reactions } });
    emitToConversation(msg.conversationId, 'message:reaction', { id, reactions, conversationId: msg.conversationId });

    res.json({ success: true, data: { reactions } });
  } catch (err) { next(err); }
};

export const markAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user!.id;

    await prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: new Date() },
    });

    emitToConversation(conversationId, 'message:read', { conversationId, userId, readAt: new Date() });
    res.json({ success: true, data: { message: 'Marked as read' } });
  } catch (err) { next(err); }
};
