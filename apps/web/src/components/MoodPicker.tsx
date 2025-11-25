/**
 * 心情选择器组件
 */

import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settings';

interface MoodPickerProps {
  selected: string;
  onSelect: (mood: string) => void;
}

export function MoodPicker({ selected, onSelect }: MoodPickerProps) {
  const { settings } = useSettingsStore();
  const emojis = settings.emojis;

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {emojis.map((emoji) => {
        const isSelected = emoji === selected;
        const color = settings.emojiColors[emoji];
        
        return (
          <button
            key={emoji}
            onClick={() => onSelect(isSelected ? '' : emoji)}
            className={cn(
              'emoji-picker-item w-12 h-12 text-2xl rounded-xl flex items-center justify-center transition-all',
              isSelected
                ? 'ring-2 ring-offset-2 ring-primary-500 scale-110'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            )}
            style={isSelected && color ? { backgroundColor: `${color}30` } : undefined}
          >
            {emoji}
          </button>
        );
      })}
    </div>
  );
}
