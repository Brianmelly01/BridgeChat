import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({ baseURL: BASE_URL, timeout: 10000 });

// Attach token to every request
api.interceptors.request.use((config) => {
  const raw = localStorage.getItem('admin-store');
  if (raw) {
    try {
      const { state } = JSON.parse(raw);
      if (state?.token) config.headers.Authorization = `Bearer ${state.token}`;
    } catch {}
  }
  return config;
});

// Handle 401 globally — auto sign out
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('admin-store');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  username: string;
  role: string;
  avatarUrl?: string | null;
}

interface AdminState {
  token: string | null;
  admin: AdminUser | null;
  isAuthenticated: boolean;
  setAuth: (token: string, admin: AdminUser) => void;
  logout: () => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      token: null,
      admin: null,
      isAuthenticated: false,

      setAuth: (token, admin) => {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        set({ token, admin, isAuthenticated: true });
      },

      logout: () => {
        delete api.defaults.headers.common['Authorization'];
        set({ token: null, admin: null, isAuthenticated: false });
      },
    }),
    {
      name: 'admin-store',
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
          // Mark as authenticated on rehydrate
          state.isAuthenticated = true;
        }
      },
    }
  )
);
