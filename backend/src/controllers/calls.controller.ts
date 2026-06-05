import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { emitToUser } from '../services/socket.service';
import { createAndSendNotification } from '../services/notification.service';

export const initiateCall = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { recipientId, type, conversationId } = req.body;
    if (!recipientId || !type) return res.status(400).json({ success: false, error: 'recipientId and type required' });

    const caller = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { id: true, displayName: true, avatarUrl: true, username: true } });
    const recipient = await prisma.user.findUnique({ where: { id: recipientId } });
    if (!recipient) return res.status(404).json({ success: false, error: 'Recipient not found' });

    const call = await prisma.call.create({
      data: {
        callerId: req.user!.id,
        type,
        status: 'RINGING',
        conversationId,
        participants: { create: { userId: req.user!.id } },
      },
    });

    emitToUser(recipientId, 'call:incoming', { call, caller, type });
    await createAndSendNotification(recipientId, 'INCOMING_CALL', `${caller?.displayName} is calling`, `${type} call`, { callId: call.id, callerId: req.user!.id, type });

    res.status(201).json({ success: true, data: { call } });
  } catch (err) { next(err); }
};

export const acceptCall = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const call = await prisma.call.update({
      where: { id },
      data: { status: 'ONGOING', startedAt: new Date() },
    });

    await prisma.callParticipant.upsert({
      where: { callId_userId: { callId: id, userId } },
      create: { callId: id, userId },
      update: { joinedAt: new Date() },
    });

    emitToUser(call.callerId, 'call:accepted', { callId: id, userId });
    res.json({ success: true, data: { call } });
  } catch (err) { next(err); }
};

export const rejectCall = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const call = await prisma.call.update({ where: { id }, data: { status: 'REJECTED' } });
    emitToUser(call.callerId, 'call:rejected', { callId: id, userId: req.user!.id });
    await createAndSendNotification(call.callerId, 'MISSED_CALL', 'Missed call', `${req.user!.username} rejected your call`, { callId: id });
    res.json({ success: true, data: { call } });
  } catch (err) { next(err); }
};

export const endCall = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const call = await prisma.call.findUnique({ where: { id }, include: { participants: true } });
    if (!call) return res.status(404).json({ success: false, error: 'Call not found' });

    const endedAt = new Date();
    const duration = call.startedAt ? Math.floor((endedAt.getTime() - call.startedAt.getTime()) / 1000) : 0;

    const updated = await prisma.call.update({ where: { id }, data: { status: 'ENDED', endedAt, duration } });
    await prisma.callParticipant.updateMany({ where: { callId: id, leftAt: null }, data: { leftAt: endedAt } });

    call.participants.forEach(p => {
      if (p.userId !== req.user!.id) emitToUser(p.userId, 'call:ended', { callId: id, duration });
    });

    res.json({ success: true, data: { call: updated } });
  } catch (err) { next(err); }
};

export const getCallHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { limit = '20', cursor } = req.query;

    const participations = await prisma.callParticipant.findMany({
      where: { userId },
      take: Number(limit),
      ...(cursor ? { skip: 1, cursor: { id: String(cursor) } } : {}),
      include: {
        call: {
          include: {
            caller: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
            participants: { include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    const calls = participations.map(p => ({
      ...p.call,
      direction: p.call.callerId === userId ? 'outgoing' : 'incoming',
    }));

    res.json({ success: true, data: { calls, nextCursor: participations.length === Number(limit) ? participations[participations.length - 1].id : null } });
  } catch (err) { next(err); }
};
