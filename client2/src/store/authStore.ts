import { create } from 'zustand';
import type { User, RegisterData } from '../types';
import authService from '../services/authService';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,

  initializeAuth: async () => {
    const isTokenValid = authService.initializeAuth();
    if (isTokenValid) {
      try {
        const freshUser = await authService.getMe();
        localStorage.setItem('user', JSON.stringify(freshUser));
        set({ user: freshUser, isAuthenticated: true, loading: false });
      } catch {
        // token expired or invalid — fall back to cached user
        const savedUser = authService.getCurrentUser();
        set({ user: savedUser, isAuthenticated: true, loading: false });
      }
    } else {
      set({ loading: false });
    }
  },

  login: async (email: string, password: string) => {
    const response = await authService.login(email, password);
    set({ user: response.user, isAuthenticated: true });
  },

  register: async (userData: RegisterData) => {
    const response = await authService.register(userData);
    set({ user: response.user, isAuthenticated: true });
  },

  logout: () => {
    authService.logout();
    set({ user: null, isAuthenticated: false });
  },
}));
