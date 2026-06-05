import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { socketService } from '../services/socket';

export interface User {
  id: string;
  email?: string | null;
  phone?: string | null;
  username: string;
  displayName: string;
  bio?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  location?: string | null;
  isPrivate: boolean;
  isVerified: boolean;
  isOnline: boolean;
  isBanned: boolean;
  role: 'USER' | 'MODERATOR' | 'ADMIN';
  emailVerified: boolean;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  onlineUsers: Record<string, boolean>;
  setUser: (user: User) => void;
  updateUser: (updates: Partial<User>) => void;
  setLoading: (v: boolean) => void;
  login: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  setUserOnline: (userId: string, online: boolean) => void;
  loadStoredAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  onlineUsers: {},

  setUser: (user) => set({ user, isAuthenticated: true }),
  updateUser: (updates) => set(s => ({ user: s.user ? { ...s.user, ...updates } : s.user })),
  setLoading: (isLoading) => set({ isLoading }),

  login: async (user, accessToken, refreshToken) => {
    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    set({ user, isAuthenticated: true, isLoading: false });
    await socketService.connect();
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    socketService.disconnect();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  setUserOnline: (userId, online) =>
    set(s => ({ onlineUsers: { ...s.onlineUsers, [userId]: online } })),

  loadStoredAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (!token) { set({ isLoading: false }); return; }
      const { authService } = await import('../services/apiServices');
      const res = await authService.getMe();
      const user = res.data.data.user;
      set({ user, isAuthenticated: true, isLoading: false });
      await socketService.connect();
    } catch {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      set({ isAuthenticated: false, isLoading: false });
    }
  },
}));
