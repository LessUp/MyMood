/**
 * 日历组件
 */

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn, formatDateKey, getTodayKey } from '@/lib/utils';
import { useMoodStore } from '@/stores/mood';
import { useSettingsStore } from '@/stores/settings';

interface CalendarProps {
  onSelectDate: (dateKey: string) => void;
  selectedDate: string | null;
}

const WEEKDAYS_ZH = ['日', '一', '二', '三', '四', '五', '六'];
const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function Calendar({ onSelectDate, selectedDate }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { records } = useMoodStore();
  const { settings } = useSettingsStore();
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const todayKey = getTodayKey();
  
  const weekdays = settings.language === 'en' ? WEEKDAYS_EN : WEEKDAYS_ZH;
  const orderedWeekdays = settings.weekStart === 1 
    ? [...weekdays.slice(1), weekdays[0]]
    : weekdays;

  // 生成日历网格
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    let startOffset = firstDay - settings.weekStart;
    if (startOffset < 0) startOffset += 7;
    
    const days: Array<{
      year: number;
      month: number;
      day: number;
      isCurrentMonth: boolean;
      dateKey: string;
    }> = [];
    
    // 上月的日期
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    for (let i = startOffset - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      days.push({
        year: prevYear,
        month: prevMonth,
        day,
        isCurrentMonth: false,
        dateKey: formatDateKey(new Date(prevYear, prevMonth, day))
      });
    }
    
    // 当月的日期
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        year,
        month,
        day,
        isCurrentMonth: true,
        dateKey: formatDateKey(new Date(year, month, day))
      });
    }
    
    // 下月的日期（补齐到42个）
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    let nextDay = 1;
    while (days.length < 42) {
      days.push({
        year: nextYear,
        month: nextMonth,
        day: nextDay,
        isCurrentMonth: false,
        dateKey: formatDateKey(new Date(nextYear, nextMonth, nextDay))
      });
      nextDay++;
    }
    
    return days;
  }, [year, month, settings.weekStart]);

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    onSelectDate(todayKey);
  };

  const monthName = settings.language === 'en'
    ? currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : `${year}年${month + 1}月`;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4">
      {/* 月份导航 */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPrevMonth}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">{monthName}</h2>
          <button
            onClick={goToToday}
            className="text-xs px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 rounded-full hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors"
          >
            今天
          </button>
        </div>
        
        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* 星期标题 */}
      <div className="grid grid-cols-7 mb-2">
        {orderedWeekdays.map((day, i) => (
          <div
            key={i}
            className="text-center text-xs text-gray-500 dark:text-gray-400 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* 日期网格 */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map(({ day, isCurrentMonth, dateKey }) => {
          const entry = records[dateKey];
          const mood = entry?.mood;
          const hasNote = !!entry?.note;
          const isToday = dateKey === todayKey;
          const isSelected = dateKey === selectedDate;
          const moodColor = mood ? settings.emojiColors[mood] : undefined;

          return (
            <button
              key={dateKey}
              onClick={() => onSelectDate(dateKey)}
              className={cn(
                'calendar-cell relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm',
                isCurrentMonth
                  ? 'text-gray-900 dark:text-gray-100'
                  : 'text-gray-400 dark:text-gray-600',
                isToday && 'ring-2 ring-primary-500',
                isSelected && 'bg-primary-100 dark:bg-primary-900/50',
                !isSelected && 'hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
              style={moodColor ? { backgroundColor: `${moodColor}20` } : undefined}
            >
              <span className={cn(isToday && 'font-bold')}>{day}</span>
              {mood && <span className="text-lg leading-none mt-0.5">{mood}</span>}
              {hasNote && (
                <span className="absolute bottom-1 w-1.5 h-1.5 bg-primary-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
