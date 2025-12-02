import { describe, expect, it } from 'vitest';
import {
  calculateDistribution,
  calculateStreak,
  calculateLongestStreak,
  getStatsForRange,
  searchRecords
} from '../src/stats';
import type { MoodRecordMap } from '@moodflow/types';

const sampleRecords: MoodRecordMap = {
  '2024-01-01': { mood: 'happy', note: 'Sunny', ts: 1 },
  '2024-01-02': { mood: 'happy', ts: 2 },
  '2024-01-03': { mood: 'sad', note: 'Rain', ts: 3 },
  '2024-01-05': { mood: 'calm', ts: 4 }
};

describe('stats helpers', () => {
  it('calculates distribution correctly', () => {
    expect(calculateDistribution(sampleRecords)).toEqual({
      happy: 2,
      sad: 1,
      calm: 1
    });
  });

  it('computes streaks with gaps', () => {
    const streak = calculateStreak(sampleRecords);
    const longest = calculateLongestStreak(sampleRecords);

    expect(streak).toBe(0);
    expect(longest).toBe(3);
  });

  it('builds stats for a given range', () => {
    const stats = getStatsForRange(sampleRecords, '2024-01-01', '2024-01-05');

    expect(stats.total).toBe(4);
    expect(stats.trend).toHaveLength(5);
    expect(stats.distribution.happy).toBe(2);
  });

  it('searches by keyword, mood and date filters', () => {
    const results = searchRecords(sampleRecords, {
      keyword: 'rain',
      mood: 'sad',
      startDate: '2024-01-01',
      endDate: '2024-01-04'
    });

    expect(results).toHaveLength(1);
    expect(results[0].dateKey).toBe('2024-01-03');
  });
});
