/**
 * 快捷记录组件 - 首页快速记录今日心情
 */

import { useState } from 'react';
import { Check, Pencil } from 'lucide-react';
import { useMoodStore } from '@/stores/mood';
import { useSettingsStore } from '@/stores/settings';
import { getTodayKey } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface QuickRecordProps {
  onOpenDetail?: () => void;
}

export function QuickRecord({ onOpenDetail }: QuickRecordProps) {
  const { records, setMood } = useMoodStore();
  const { settings } = useSettingsStore();
  const todayKey = getTodayKey();
  const todayEntry = records[todayKey];
  const [saving, setSaving] = useState(false);

  const handleQuickMood = async (mood: string) => {
    setSaving(true);
    await setMood(todayKey, mood);
    setSaving(false);
  };

  const today = new Date();
  const dateStr = settings.language === 'en'
    ? today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : today.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm text-gray-500 dark:text-gray-400">今日心情</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500">{dateStr}</p>
        </div>
        {todayEntry?.mood && (
          <div className="flex items-center gap-2">
            <span className="text-3xl">{todayEntry.mood}</span>
            <Check className="w-4 h-4 text-green-500" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 flex gap-1 overflow-x-auto pb-1 no-scrollbar">
          {settings.emojis.map((emoji) => {
            const isSelected = emoji === todayEntry?.mood;
            const color = settings.emojiColors[emoji];
            
            return (
              <button
                key={emoji}
                onClick={() => handleQuickMood(isSelected ? '' : emoji)}
                disabled={saving}
                className={cn(
                  'flex-shrink-0 w-10 h-10 text-xl rounded-lg transition-all touch-feedback',
                  isSelected
                    ? 'ring-2 ring-primary-500 scale-110'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
                style={isSelected && color ? { backgroundColor: `${color}20` } : undefined}
              >
                {emoji}
              </button>
            );
          })}
        </div>
        
        {onOpenDetail && (
          <button
            onClick={onOpenDetail}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            title="添加备注"
          >
            <Pencil className="w-5 h-5" />
          </button>
        )}
      </div>

      {todayEntry?.note && (
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-lg p-2 line-clamp-2">
          {todayEntry.note}
        </p>
      )}
    </div>
  );
}
