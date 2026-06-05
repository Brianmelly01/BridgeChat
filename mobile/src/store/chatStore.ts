import { create } from 'zustand';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'VOICE_NOTE' | 'EMOJI';
  content?: string | null;
  mediaUrl?: string | null;
  mediaSize?: number | null;
  mediaMime?: string | null;
  mediaName?: string | null;
  isEdited: boolean;
  isDeleted: boolean;
  replyToId?: string | null;
  reactions: Record<string, string>;
  readBy: string[];
  createdAt: string;
  updatedAt: string;
  sender: { id: string; displayName: string; avatarUrl?: string | null };
  replyTo?: { id: string; content?: string | null; sender: { displayName: string } } | null;
}

export interface Conversation {
  id: string;
  type: 'DIRECT' | 'GROUP';
  name?: string | null;
  avatarUrl?: string | null;
  lastMessage?: any;
  lastMessageAt: string;
  unreadCount: number;
  participants: any[];
  otherParticipant?: any;
}

interface ChatState {
  conversations: Record<string, Conversation>;
  messages: Record<string, Message[]>;
  activeConversationId: string | null;
  typingUsers: Record<string, Set<string>>;

  setConversations: (convs: Conversation[]) => void;
  addConversation: (conv: Conversation) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  removeConversation: (id: string) => void;

  setMessages: (convId: string, msgs: Message[]) => void;
  prependMessages: (convId: string, msgs: Message[]) => void;
  addMessage: (convId: string, msg: Message) => void;
  updateMessage: (convId: string, msg: Message) => void;
  deleteMessage: (convId: string, msgId: string) => void;

  setActiveConversation: (id: string | null) => void;
  resetUnread: (convId: string) => void;
  setTyping: (convId: string, userId: string, typing: boolean) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: {},
  messages: {},
  activeConversationId: null,
  typingUsers: {},

  setConversations: (convs) => set({ conversations: Object.fromEntries(convs.map(c => [c.id, c])) }),
  addConversation: (conv) => set(s => ({ conversations: { [conv.id]: conv, ...s.conversations } })),
  updateConversation: (id, updates) => set(s => ({
    conversations: s.conversations[id] ? { ...s.conversations, [id]: { ...s.conversations[id], ...updates } } : s.conversations,
  })),
  removeConversation: (id) => set(s => {
    const next = { ...s.conversations }; delete next[id]; return { conversations: next };
  }),

  setMessages: (convId, msgs) => set(s => ({ messages: { ...s.messages, [convId]: msgs } })),
  prependMessages: (convId, msgs) => set(s => ({ messages: { ...s.messages, [convId]: [...msgs, ...(s.messages[convId] || [])] } })),
  addMessage: (convId, msg) => set(s => {
    const existing = s.messages[convId] || [];
    const alreadyExists = existing.some(m => m.id === msg.id);
    const updated = alreadyExists ? existing : [...existing, msg];
    const conv = s.conversations[convId];
    const isActive = s.activeConversationId === convId;
    return {
      messages: { ...s.messages, [convId]: updated },
      conversations: conv ? {
        ...s.conversations,
        [convId]: {
          ...conv,
          lastMessage: msg,
          lastMessageAt: msg.createdAt,
          unreadCount: isActive ? 0 : (conv.unreadCount || 0) + 1,
        },
      } : s.conversations,
    };
  }),
  updateMessage: (convId, msg) => set(s => ({
    messages: { ...s.messages, [convId]: (s.messages[convId] || []).map(m => m.id === msg.id ? msg : m) },
  })),
  deleteMessage: (convId, msgId) => set(s => ({
    messages: { ...s.messages, [convId]: (s.messages[convId] || []).map(m => m.id === msgId ? { ...m, isDeleted: true } : m) },
  })),

  setActiveConversation: (id) => set({ activeConversationId: id }),
  resetUnread: (convId) => set(s => ({
    conversations: s.conversations[convId] ? { ...s.conversations, [convId]: { ...s.conversations[convId], unreadCount: 0 } } : s.conversations,
  })),
  setTyping: (convId, userId, typing) => set(s => {
    const set_ = new Set(s.typingUsers[convId] || []);
    typing ? set_.add(userId) : set_.delete(userId);
    return { typingUsers: { ...s.typingUsers, [convId]: set_ } };
  }),
}));
