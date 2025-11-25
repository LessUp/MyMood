/**
 * 日历页面
 */

import { useState, useEffect } from 'react';
import { Calendar } from '@/components/Calendar';
import { DetailPanel } from '@/components/DetailPanel';
import { useMoodStore } from '@/stores/mood';
import { getTodayKey } from '@/lib/utils';

export function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { loadRecords } = useMoodStore();

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <Calendar 
          selectedDate={selectedDate} 
          onSelectDate={setSelectedDate} 
        />
      </div>
      
      <div>
        {selectedDate ? (
          <DetailPanel 
            dateKey={selectedDate} 
            onClose={() => setSelectedDate(null)} 
          />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8 text-center text-gray-500 dark:text-gray-400">
            <p className="text-4xl mb-4">📅</p>
            <p>点击日历中的日期</p>
            <p>记录今天的心情</p>
          </div>
        )}
      </div>
    </div>
  );
}
