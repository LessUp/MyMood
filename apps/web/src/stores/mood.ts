/**
 * 心情数据状态管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MoodRecordMap, MoodEntry } from '@moodflow/types';
import { useAuthStore } from './auth';

interface MoodState {
  records: MoodRecordMap;
  isLoading: boolean;
  isSyncing: boolean;
  lastSyncAt: number | null;
  
  loadRecords: () => Promise<void>;
  setMood: (dateKey: string, mood: string) => Promise<void>;
  setNote: (dateKey: string, note: string) => Promise<void>;
  clearEntry: (dateKey: string) => Promise<void>;
  syncWithCloud: () => Promise<void>;
  importRecords: (data: MoodRecordMap, overwrite?: boolean) => Promise<void>;
  exportRecords: () => MoodRecordMap;
}

const API_BASE = '/api';

export const useMoodStore = create<MoodState>()(
  persist(
    (set, get) => ({
      records: {},
      isLoading: false,
      isSyncing: false,
      lastSyncAt: null,

      loadRecords: async () => {
        const { tokens, isAuthenticated } = useAuthStore.getState();
        
        if (isAuthenticated && tokens) {
          set({ isLoading: true });
          try {
            const res = await fetch(`${API_BASE}/sync/records`, {
              headers: { Authorization: `Bearer ${tokens.accessToken}` }
            });
            const data = await res.json();
            
            if (data.success) {
              set({ records: data.data, isLoading: false });
            }
          } catch {
            set({ isLoading: false });
          }
        }
      },

      setMood: async (dateKey, mood) => {
        const { records } = get();
        const { tokens, isAuthenticated } = useAuthStore.getState();
        
        // 本地更新
        const newRecords = { ...records };
        if (mood) {
          newRecords[dateKey] = {
            ...newRecords[dateKey],
            mood,
            ts: Date.now()
          };
        } else if (newRecords[dateKey]) {
          if (newRecords[dateKey].note) {
            delete newRecords[dateKey].mood;
            newRecords[dateKey].ts = Date.now();
          } else {
            delete newRecords[dateKey];
          }
        }
        
        set({ records: newRecords });
        
        // 云同步
        if (isAuthenticated && tokens) {
          try {
            await fetch(`${API_BASE}/sync/records/${dateKey}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${tokens.accessToken}`
              },
              body: JSON.stringify({ 
                mood, 
                note: newRecords[dateKey]?.note || '' 
              })
            });
          } catch {
            // 离线时静默失败
          }
        }
      },

      setNote: async (dateKey, note) => {
        const { records } = get();
        const { tokens, isAuthenticated } = useAuthStore.getState();
        
        // 本地更新
        const newRecords = { ...records };
        if (note) {
          newRecords[dateKey] = {
            ...newRecords[dateKey],
            note,
            ts: Date.now()
          };
        } else if (newRecords[dateKey]) {
          if (newRecords[dateKey].mood) {
            delete newRecords[dateKey].note;
            newRecords[dateKey].ts = Date.now();
          } else {
            delete newRecords[dateKey];
          }
        }
        
        set({ records: newRecords });
        
        // 云同步
        if (isAuthenticated && tokens) {
          try {
            await fetch(`${API_BASE}/sync/records/${dateKey}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${tokens.accessToken}`
              },
              body: JSON.stringify({ 
                mood: newRecords[dateKey]?.mood || '', 
                note 
              })
            });
          } catch {
            // 离线时静默失败
          }
        }
      },

      clearEntry: async (dateKey) => {
        const { records } = get();
        const { tokens, isAuthenticated } = useAuthStore.getState();
        
        const newRecords = { ...records };
        delete newRecords[dateKey];
        set({ records: newRecords });
        
        if (isAuthenticated && tokens) {
          try {
            await fetch(`${API_BASE}/sync/records/${dateKey}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${tokens.accessToken}` }
            });
          } catch {
            // 离线时静默失败
          }
        }
      },

      syncWithCloud: async () => {
        const { tokens, isAuthenticated } = useAuthStore.getState();
        if (!isAuthenticated || !tokens) return;
        
        set({ isSyncing: true });
        
        try {
          const { records } = get();
          
          // 上传本地数据
          await fetch(`${API_BASE}/sync/records`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${tokens.accessToken}`
            },
            body: JSON.stringify({ records })
          });
          
          // 获取最新数据
          const res = await fetch(`${API_BASE}/sync/records`, {
            headers: { Authorization: `Bearer ${tokens.accessToken}` }
          });
          const data = await res.json();
          
          if (data.success) {
            set({ 
              records: data.data, 
              lastSyncAt: Date.now(),
              isSyncing: false 
            });
          }
        } catch {
          set({ isSyncing: false });
        }
      },

      importRecords: async (data, overwrite = false) => {
        const { records } = get();
        
        if (overwrite) {
          set({ records: data });
        } else {
          // 合并（后写优先）
          const merged = { ...records };
          for (const [key, entry] of Object.entries(data)) {
            const existing = merged[key];
            if (!existing || entry.ts > existing.ts) {
              merged[key] = entry;
            }
          }
          set({ records: merged });
        }
      },

      exportRecords: () => {
        return get().records;
      }
    }),
    {
      name: 'moodflow-records',
      partialize: (state) => ({ 
        records: state.records,
        lastSyncAt: state.lastSyncAt 
      })
    }
  )
);
