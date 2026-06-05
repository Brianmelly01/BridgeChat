import { create } from 'zustand';

interface UIState {
  isDarkMode: boolean;
  isOnboardingComplete: boolean;
  activeModal: string | null;
  toastMessage: string | null;
  setDarkMode: (isDark: boolean) => void;
  setOnboardingComplete: (complete: boolean) => void;
  openModal: (modal: string) => void;
  closeModal: () => void;
  showToast: (message: string) => void;
  clearToast: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isDarkMode: true,
  isOnboardingComplete: false,
  activeModal: null,
  toastMessage: null,
  setDarkMode: (isDarkMode) => set({ isDarkMode }),
  setOnboardingComplete: (isOnboardingComplete) => set({ isOnboardingComplete }),
  openModal: (activeModal) => set({ activeModal }),
  closeModal: () => set({ activeModal: null }),
  showToast: (toastMessage) => set({ toastMessage }),
  clearToast: () => set({ toastMessage: null }),
}));
