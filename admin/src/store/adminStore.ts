import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({ baseURL: BASE_URL });

interface AdminState {
  token: string | null;
  admin: any | null;
  setAuth: (token: string, admin: any) => void;
  logout: () => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      token: null,
      admin: null,
      setAuth: (token, admin) => {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        set({ token, admin });
      },
      logout: () => {
        delete api.defaults.headers.common['Authorization'];
        set({ token: null, admin: null });
      },
    }),
    { name: 'admin-store', onRehydrateStorage: () => (state) => { if (state?.token) api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`; } }
  )
);
