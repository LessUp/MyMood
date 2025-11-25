/**
 * 日历页面
 */

import { useState, useEffect } from 'react';
import { Calendar } from '@/components/Calendar';
import { DetailPanel } from '@/components/DetailPanel';
import { QuickRecord } from '@/components/QuickRecord';
import { useMoodStore } from '@/stores/mood';
import { getTodayKey } from '@/lib/utils';
import { useIsMobile } from '@/hooks';

export function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { loadRecords } = useMoodStore();
  const isMobile = useIsMobile();
  const todayKey = getTodayKey();

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handleOpenTodayDetail = () => {
    setSelectedDate(todayKey);
  };

  return (
    <div className="space-y-4">
      {/* 快捷记录 - 移动端显示在顶部 */}
      {isMobile && (
        <QuickRecord onOpenDetail={handleOpenTodayDetail} />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Calendar 
            selectedDate={selectedDate} 
            onSelectDate={setSelectedDate} 
          />
          {/* 桌面端快捷记录显示在日历下方 */}
          {!isMobile && (
            <QuickRecord onOpenDetail={handleOpenTodayDetail} />
          )}
        </div>
        
        <div>
          {selectedDate ? (
            <DetailPanel 
              dateKey={selectedDate} 
              onClose={() => setSelectedDate(null)} 
            />
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8 text-center text-gray-500 dark:text-gray-400 hidden lg:block">
              <p className="text-4xl mb-4">📅</p>
              <p>点击日历中的日期</p>
              <p>记录今天的心情</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
