/**
 * 认证状态管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthToken } from '@moodflow/types';

interface AuthState {
  user: User | null;
  tokens: AuthToken | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username?: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
  refreshToken: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

const API_BASE = '/api';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          
          const data = await res.json();
          
          if (!data.success) {
            throw new Error(data.error?.message || '登录失败');
          }
          
          set({
            user: data.data.user,
            tokens: data.data.tokens,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (email, password, username) => {
        set({ isLoading: true });
        try {
          const res = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, username })
          });
          
          const data = await res.json();
          
          if (!data.success) {
            throw new Error(data.error?.message || '注册失败');
          }
          
          set({
            user: data.data.user,
            tokens: data.data.tokens,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          tokens: null,
          isAuthenticated: false
        });
      },

      checkAuth: () => {
        const { tokens } = get();
        if (tokens && tokens.expiresAt > Date.now()) {
          set({ isAuthenticated: true });
        } else {
          set({ isAuthenticated: false, tokens: null, user: null });
        }
      },

      refreshToken: async () => {
        const { tokens } = get();
        if (!tokens?.refreshToken) return;
        
        try {
          const res = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: tokens.refreshToken })
          });
          
          const data = await res.json();
          
          if (data.success) {
            set({ tokens: data.data.tokens });
          } else {
            set({ isAuthenticated: false, tokens: null, user: null });
          }
        } catch {
          set({ isAuthenticated: false, tokens: null, user: null });
        }
      },

      updateUser: (userData) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...userData } as User });
        }
      }
    }),
    {
      name: 'moodflow-auth',
      partialize: (state) => ({ 
        user: state.user, 
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated 
      })
    }
  )
);
