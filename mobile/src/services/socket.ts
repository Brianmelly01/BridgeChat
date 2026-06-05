import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  async connect() {
    if (this.socket?.connected) return;
    const token = await SecureStore.getItemAsync('accessToken');
    if (!token) return;

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    this.socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });

    // Message events
    this.socket.on('message:new', (message: any) => {
      const { addMessage, activeConversationId, resetUnread } = useChatStore.getState();
      addMessage(message.conversationId, message);
      if (activeConversationId !== message.conversationId) {
        // Handled by store's unreadCount logic
      }
    });

    this.socket.on('message:edited', (message: any) => {
      useChatStore.getState().updateMessage(message.conversationId, message);
    });

    this.socket.on('message:deleted', ({ conversationId, messageId }: any) => {
      useChatStore.getState().deleteMessage(conversationId, messageId);
    });

    // Typing events
    this.socket.on('typing:start', ({ conversationId, userId }: any) => {
      useChatStore.getState().setTyping(conversationId, userId, true);
    });

    this.socket.on('typing:stop', ({ conversationId, userId }: any) => {
      useChatStore.getState().setTyping(conversationId, userId, false);
    });

    // User presence
    this.socket.on('user:online', ({ userId }: any) => {
      useAuthStore.getState().setUserOnline(userId, true);
    });

    this.socket.on('user:offline', ({ userId }: any) => {
      useAuthStore.getState().setUserOnline(userId, false);
    });

    // Forward registered listeners
    this.listeners.forEach((cbs, event) => {
      cbs.forEach(cb => this.socket?.on(event, cb as any));
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  emit(event: string, data?: any) {
    if (!this.socket?.connected) { console.warn('[Socket] Not connected, cannot emit:', event); return; }
    this.socket.emit(event, data);
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(callback);
    this.socket?.on(event, callback as any);
  }

  off(event: string, callback?: Function) {
    if (callback) {
      this.listeners.get(event)?.delete(callback);
      this.socket?.off(event, callback as any);
    } else {
      this.listeners.delete(event);
      this.socket?.off(event);
    }
  }

  joinConversation(conversationId: string) { this.emit('conversation:join', { conversationId }); }
  leaveConversation(conversationId: string) { this.emit('conversation:leave', { conversationId }); }
  sendTypingStart(conversationId: string) { this.emit('typing:start', { conversationId }); }
  sendTypingStop(conversationId: string) { this.emit('typing:stop', { conversationId }); }

  // WebRTC signaling
  sendCallSignal(data: { callId: string; participantId: string; signal: any }) {
    this.emit('call:signal', data);
  }
}

export const socketService = new SocketService();
