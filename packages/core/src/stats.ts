/**
 * 统计计算模块
 */

import type { MoodRecordMap, MoodStats, DateKey } from '@moodflow/types';
import { formatDateKey, parseDateKey, getDateRange } from './date';

/**
 * 计算心情分布
 */
export function calculateDistribution(records: MoodRecordMap): Record<string, number> {
  const distribution: Record<string, number> = {};
  
  for (const key in records) {
    const mood = records[key]?.mood;
    if (mood) {
      distribution[mood] = (distribution[mood] || 0) + 1;
    }
  }
  
  return distribution;
}

/**
 * 计算连续记录天数（从今天往前）
 */
export function calculateStreak(records: MoodRecordMap): number {
  const today = new Date();
  let streak = 0;
  let current = new Date(today);
  
  while (true) {
    const key = formatDateKey(current);
    const entry = records[key];
    
    if (entry?.mood) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
}

/**
 * 计算最长连续记录天数
 */
export function calculateLongestStreak(records: MoodRecordMap): number {
  const keys = Object.keys(records)
    .filter(k => records[k]?.mood)
    .sort();
  
  if (keys.length === 0) return 0;
  
  let longest = 1;
  let current = 1;
  
  for (let i = 1; i < keys.length; i++) {
    const prev = parseDateKey(keys[i - 1]);
    const curr = parseDateKey(keys[i]);
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    
    if (diff === 1) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }
  
  return longest;
}

/**
 * 获取日期范围内的统计
 */
export function getStatsForRange(
  records: MoodRecordMap,
  startDate: DateKey,
  endDate: DateKey
): MoodStats {
  const rangeKeys = getDateRange(startDate, endDate);
  const filteredRecords: MoodRecordMap = {};
  
  for (const key of rangeKeys) {
    if (records[key]) {
      filteredRecords[key] = records[key];
    }
  }
  
  const distribution = calculateDistribution(filteredRecords);
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
  
  // 构建趋势数据
  const trend = rangeKeys.map(date => {
    const entry = records[date];
    return {
      date,
      mood: entry?.mood || '',
      count: entry?.mood ? 1 : 0
    };
  });
  
  return {
    period: 'day',
    startDate,
    endDate,
    total,
    distribution,
    streak: calculateStreak(records),
    longestStreak: calculateLongestStreak(records),
    trend
  };
}

/**
 * 获取周统计
 */
export function getWeekStats(records: MoodRecordMap, weekOffset = 0): MoodStats {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + (weekOffset * 7));
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  
  const stats = getStatsForRange(
    records,
    formatDateKey(startOfWeek),
    formatDateKey(endOfWeek)
  );
  stats.period = 'week';
  
  return stats;
}

/**
 * 获取月统计
 */
export function getMonthStats(
  records: MoodRecordMap,
  year: number,
  month: number
): MoodStats {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);
  
  const stats = getStatsForRange(
    records,
    formatDateKey(startDate),
    formatDateKey(endDate)
  );
  stats.period = 'month';
  
  return stats;
}

/**
 * 获取年统计
 */
export function getYearStats(records: MoodRecordMap, year: number): MoodStats {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);
  
  const stats = getStatsForRange(
    records,
    formatDateKey(startDate),
    formatDateKey(endDate)
  );
  stats.period = 'year';
  
  return stats;
}

/**
 * 搜索记录
 */
export function searchRecords(
  records: MoodRecordMap,
  options: {
    keyword?: string;
    mood?: string;
    startDate?: DateKey;
    endDate?: DateKey;
    hasNote?: boolean;
  }
): Array<{ dateKey: DateKey; entry: MoodRecordMap[string] }> {
  const results: Array<{ dateKey: DateKey; entry: MoodRecordMap[string] }> = [];
  
  for (const dateKey in records) {
    const entry = records[dateKey];
    if (!entry) continue;
    
    // 日期范围过滤
    if (options.startDate && dateKey < options.startDate) continue;
    if (options.endDate && dateKey > options.endDate) continue;
    
    // 心情过滤
    if (options.mood && entry.mood !== options.mood) continue;
    
    // 备注过滤
    if (options.hasNote !== undefined) {
      const hasNote = !!entry.note;
      if (options.hasNote !== hasNote) continue;
    }
    
    // 关键词搜索
    if (options.keyword) {
      const kw = options.keyword.toLowerCase();
      const note = (entry.note || '').toLowerCase();
      if (!note.includes(kw)) continue;
    }
    
    results.push({ dateKey, entry });
  }
  
  // 按日期降序排序
  results.sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  
  return results;
}
