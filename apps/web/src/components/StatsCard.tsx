/**
 * 统计卡片组件
 */

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
}

export function StatsCard({ title, value, icon, trend, className }: StatsCardProps) {
  return (
    <div className={cn(
      'bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4',
      className
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {trend && (
            <p className={cn(
              'text-xs mt-1',
              trend.value >= 0 ? 'text-green-500' : 'text-red-500'
            )}>
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        {icon && (
          <div className="text-2xl">{icon}</div>
        )}
      </div>
    </div>
  );
}

interface MoodDistributionBarProps {
  distribution: Record<string, number>;
  colors: Record<string, string>;
  total: number;
}

export function MoodDistributionBar({ distribution, colors, total }: MoodDistributionBarProps) {
  if (total === 0) return null;

  const entries = Object.entries(distribution).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-2">
      {entries.map(([mood, count]) => {
        const percentage = Math.round((count / total) * 100);
        const color = colors[mood] || '#888';
        
        return (
          <div key={mood} className="flex items-center gap-2">
            <span className="text-lg w-8">{mood}</span>
            <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${percentage}%`,
                  backgroundColor: color
                }}
              />
            </div>
            <span className="text-sm text-gray-500 w-12 text-right">{percentage}%</span>
          </div>
        );
      })}
    </div>
  );
}

interface HeatmapProps {
  data: Record<string, { mood?: string; count: number }>;
  year: number;
  colors: Record<string, string>;
}

export function YearHeatmap({ data, year, colors }: HeatmapProps) {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);
  
  const weeks: Array<Array<{ date: string; mood?: string }>> = [];
  let currentWeek: Array<{ date: string; mood?: string }> = [];
  
  const current = new Date(startDate);
  
  // 填充第一周开头的空格
  const firstDayOfWeek = current.getDay();
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push({ date: '' });
  }
  
  while (current <= endDate) {
    const dateKey = current.toISOString().split('T')[0];
    currentWeek.push({
      date: dateKey,
      mood: data[dateKey]?.mood
    });
    
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    
    current.setDate(current.getDate() + 1);
  }
  
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-0.5 min-w-max">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-0.5">
            {week.map((day, dayIndex) => {
              const color = day.mood ? colors[day.mood] : undefined;
              return (
                <div
                  key={dayIndex}
                  className={cn(
                    'w-3 h-3 rounded-sm',
                    day.date 
                      ? color 
                        ? '' 
                        : 'bg-gray-100 dark:bg-gray-700'
                      : 'bg-transparent'
                  )}
                  style={color ? { backgroundColor: color } : undefined}
                  title={day.date ? `${day.date}${day.mood ? ` ${day.mood}` : ''}` : undefined}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
