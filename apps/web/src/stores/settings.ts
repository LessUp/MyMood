/**
 * 设置状态管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_SETTINGS, type UserSettings } from '@moodflow/types';

interface SettingsState {
  settings: UserSettings;
  loadSettings: () => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,

      loadSettings: () => {
        // 从本地存储加载已在 persist 中处理
      },

      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings }
        }));
      },

      resetSettings: () => {
        set({ settings: DEFAULT_SETTINGS });
      }
    }),
    {
      name: 'moodflow-settings',
      partialize: (state) => ({ settings: state.settings })
    }
  )
);
