/**
 * 日期工具函数
 */

import type { DateKey } from '@moodflow/types';

/**
 * 格式化日期为 YYYY-MM-DD
 */
export function formatDateKey(date: Date): DateKey {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 解析日期键为 Date 对象
 */
export function parseDateKey(key: DateKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * 获取今天的日期键
 */
export function getTodayKey(): DateKey {
  return formatDateKey(new Date());
}

/**
 * 获取指定年月的天数
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * 获取指定日期是星期几 (0-6, 0=周日)
 */
export function getDayOfWeek(year: number, month: number, day: number): number {
  return new Date(year, month, day).getDay();
}

/**
 * 获取月份的第一天是星期几
 */
export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

/**
 * 生成月份的日历网格数据
 */
export function generateCalendarGrid(
  year: number,
  month: number,
  weekStart: 0 | 1 = 1
): Array<{ year: number; month: number; day: number; isCurrentMonth: boolean }> {
  const result: Array<{ year: number; month: number; day: number; isCurrentMonth: boolean }> = [];
  
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  // 计算需要显示的上月天数
  let prevDays = firstDay - weekStart;
  if (prevDays < 0) prevDays += 7;
  
  // 上个月的天数
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);
  
  // 填充上月日期
  for (let i = prevDays - 1; i >= 0; i--) {
    result.push({
      year: prevYear,
      month: prevMonth,
      day: daysInPrevMonth - i,
      isCurrentMonth: false
    });
  }
  
  // 填充当月日期
  for (let day = 1; day <= daysInMonth; day++) {
    result.push({
      year,
      month,
      day,
      isCurrentMonth: true
    });
  }
  
  // 填充下月日期（补齐6行）
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  const totalCells = 42; // 6行 x 7列
  let nextDay = 1;
  
  while (result.length < totalCells) {
    result.push({
      year: nextYear,
      month: nextMonth,
      day: nextDay++,
      isCurrentMonth: false
    });
  }
  
  return result;
}

/**
 * 计算两个日期之间的天数
 */
export function daysBetween(start: DateKey, end: DateKey): number {
  const d1 = parseDateKey(start);
  const d2 = parseDateKey(end);
  const diff = d2.getTime() - d1.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * 获取日期范围内的所有日期键
 */
export function getDateRange(start: DateKey, end: DateKey): DateKey[] {
  const result: DateKey[] = [];
  const current = parseDateKey(start);
  const endDate = parseDateKey(end);
  
  while (current <= endDate) {
    result.push(formatDateKey(current));
    current.setDate(current.getDate() + 1);
  }
  
  return result;
}

/**
 * 检查日期键格式是否有效
 */
export function isValidDateKey(key: string): key is DateKey {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const date = parseDateKey(key);
  return !isNaN(date.getTime()) && formatDateKey(date) === key;
}

/**
 * 格式化日期为本地化字符串
 */
export function formatLocalDate(
  date: Date | DateKey,
  locale: 'zh' | 'en' = 'zh',
  format: 'short' | 'long' = 'short'
): string {
  const d = typeof date === 'string' ? parseDateKey(date) : date;
  
  if (locale === 'zh') {
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    return format === 'long' ? `${y}年${m}月${day}日` : `${m}月${day}日`;
  }
  
  return d.toLocaleDateString('en-US', {
    year: format === 'long' ? 'numeric' : undefined,
    month: 'short',
    day: 'numeric'
  });
}
