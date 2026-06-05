import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { setHashField, getHashField, deleteHashField } from '../config/redis';
import { logger } from '../config/logger';

let ioInstance: Server;

export const setupSocket = (io: Server) => {
  ioInstance = io;

  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(String(token), process.env.JWT_SECRET!) as { userId: string };
      (socket as any).userId = decoded.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket: Socket) => {
    const userId: string = (socket as any).userId;
    logger.debug(`Socket connected: ${userId} (${socket.id})`);

    // Track online status
    await setHashField('online:users', userId, socket.id);
    await prisma.user.update({ where: { id: userId }, data: { isOnline: true, lastSeen: new Date() } }).catch(() => {});

    // Join personal room
    socket.join(`user:${userId}`);

    // Join all conversation rooms
    const participants = await prisma.conversationParticipant.findMany({ where: { userId }, select: { conversationId: true } });
    participants.forEach(p => socket.join(`conv:${p.conversationId}`));

    // Notify contacts that user is online
    io.emit('user:online', { userId });

    // ── Event Handlers ───────────────────────────────────────────

    socket.on('conversation:join', (conversationId: string) => {
      socket.join(`conv:${conversationId}`);
    });

    socket.on('conversation:leave', (conversationId: string) => {
      socket.leave(`conv:${conversationId}`);
    });

    socket.on('typing:start', (data: { conversationId: string }) => {
      socket.to(`conv:${data.conversationId}`).emit('typing:start', { userId, conversationId: data.conversationId });
    });

    socket.on('typing:stop', (data: { conversationId: string }) => {
      socket.to(`conv:${data.conversationId}`).emit('typing:stop', { userId, conversationId: data.conversationId });
    });

    socket.on('message:read', (data: { conversationId: string }) => {
      socket.to(`conv:${data.conversationId}`).emit('message:read', { userId, conversationId: data.conversationId, readAt: new Date() });
    });

    // WebRTC Signaling
    socket.on('call:signal', (data: { targetUserId: string; signal: any; callId: string }) => {
      io.to(`user:${data.targetUserId}`).emit('call:signal', { from: userId, signal: data.signal, callId: data.callId });
    });

    socket.on('call:accept', (data: { callId: string; callerId: string }) => {
      io.to(`user:${data.callerId}`).emit('call:accepted', { callId: data.callId, userId });
    });

    socket.on('call:reject', (data: { callId: string; callerId: string }) => {
      io.to(`user:${data.callerId}`).emit('call:rejected', { callId: data.callId, userId });
    });

    socket.on('call:end', (data: { callId: string; participantIds: string[] }) => {
      data.participantIds?.forEach(pid => {
        if (pid !== userId) io.to(`user:${pid}`).emit('call:ended', { callId: data.callId });
      });
    });

    socket.on('call:ice-candidate', (data: { targetUserId: string; candidate: any; callId: string }) => {
      io.to(`user:${data.targetUserId}`).emit('call:ice-candidate', { from: userId, candidate: data.candidate, callId: data.callId });
    });

    // ── Disconnect ───────────────────────────────────────────────
    socket.on('disconnect', async () => {
      logger.debug(`Socket disconnected: ${userId}`);
      await deleteHashField('online:users', userId);
      await prisma.user.update({ where: { id: userId }, data: { isOnline: false, lastSeen: new Date() } }).catch(() => {});
      io.emit('user:offline', { userId, lastSeen: new Date() });
    });
  });
};

export const emitToUser = (userId: string, event: string, data: any) => {
  ioInstance?.to(`user:${userId}`).emit(event, data);
};

export const emitToConversation = (conversationId: string, event: string, data: any) => {
  ioInstance?.to(`conv:${conversationId}`).emit(event, data);
};

export const getSocketId = async (userId: string): Promise<string | undefined> => {
  return getHashField('online:users', userId);
};

export const isUserOnline = async (userId: string): Promise<boolean> => {
  const socketId = await getSocketId(userId);
  return !!socketId;
};
