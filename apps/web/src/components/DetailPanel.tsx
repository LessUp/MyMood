/**
 * 详情面板组件
 */

import { useState, useEffect } from 'react';
import { X, Trash2, Save } from 'lucide-react';
import { MoodPicker } from './MoodPicker';
import { useMoodStore } from '@/stores/mood';
import { parseDateKey } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settings';

interface DetailPanelProps {
  dateKey: string;
  onClose: () => void;
}

export function DetailPanel({ dateKey, onClose }: DetailPanelProps) {
  const { records, setMood, setNote, clearEntry } = useMoodStore();
  const { settings } = useSettingsStore();
  
  const entry = records[dateKey];
  const [mood, setMoodLocal] = useState(entry?.mood || '');
  const [note, setNoteLocal] = useState(entry?.note || '');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setMoodLocal(entry?.mood || '');
    setNoteLocal(entry?.note || '');
    setIsDirty(false);
  }, [dateKey, entry]);

  const date = parseDateKey(dateKey);
  const dateStr = settings.language === 'en'
    ? date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });

  const handleMoodChange = (newMood: string) => {
    setMoodLocal(newMood);
    setIsDirty(true);
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNoteLocal(e.target.value);
    setIsDirty(true);
  };

  const handleSave = async () => {
    await setMood(dateKey, mood);
    await setNote(dateKey, note);
    setIsDirty(false);
  };

  const handleClear = async () => {
    if (confirm('确定要清除这天的记录吗？')) {
      await clearEntry(dateKey);
      setMoodLocal('');
      setNoteLocal('');
      setIsDirty(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{dateStr}</h3>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 心情选择 */}
      <div className="mb-4">
        <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">
          今天的心情
        </label>
        <MoodPicker selected={mood} onSelect={handleMoodChange} />
      </div>

      {/* 备注输入 */}
      <div className="mb-4">
        <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">
          备注
        </label>
        <textarea
          value={note}
          onChange={handleNoteChange}
          placeholder="记录一些想法..."
          rows={4}
          className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={!isDirty}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Save className="w-4 h-4" />
          保存
        </button>
        <button
          onClick={handleClear}
          className="px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
