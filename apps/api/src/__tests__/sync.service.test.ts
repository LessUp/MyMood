import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../models/MoodRecord', () => {
  return {
    MoodRecord: {
      find: vi.fn(),
      bulkWrite: vi.fn(),
      deleteOne: vi.fn(),
      findOneAndUpdate: vi.fn(),
      deleteMany: vi.fn(),
      countDocuments: vi.fn(),
      findOne: vi.fn()
    }
  };
});

import { MoodRecord } from '../models/MoodRecord';
import { deleteAllRecords, getSyncStatus, mergeRecords, upsertRecord } from '../services/sync';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('services/sync', () => {
  it('mergeRecords uses bulkWrite and returns updated/created counters', async () => {
    (MoodRecord.find as any).mockResolvedValueOnce([
      { dateKey: '2025-01-01', ts: 1 }
    ]);

    (MoodRecord.bulkWrite as any).mockResolvedValueOnce({});

    const result = await mergeRecords('u1', {
      '2025-01-01': { mood: '😊', note: '', ts: 2 },
      '2025-01-02': { mood: '😐', note: 'x', ts: 5 }
    });

    expect(result).toEqual({ updated: 1, created: 1 });
    expect(MoodRecord.bulkWrite).toHaveBeenCalledTimes(1);
  });

  it('upsertRecord deletes when mood/note empty', async () => {
    (MoodRecord.deleteOne as any).mockResolvedValueOnce({});

    const result = await upsertRecord('u1', '2025-01-01', { mood: '', note: '' });

    expect(result).toEqual({ deleted: true });
    expect(MoodRecord.deleteOne).toHaveBeenCalledWith({ userId: 'u1', dateKey: '2025-01-01' });
  });

  it('getSyncStatus returns totals', async () => {
    (MoodRecord.countDocuments as any).mockResolvedValueOnce(10);
    (MoodRecord.findOne as any).mockReturnValueOnce({ sort: vi.fn().mockResolvedValueOnce({ ts: 123 }) });

    const result = await getSyncStatus('u1');

    expect(result).toEqual({ totalRecords: 10, lastSyncTs: 123 });
  });

  it('deleteAllRecords returns deleted count', async () => {
    (MoodRecord.deleteMany as any).mockResolvedValueOnce({ deletedCount: 7 });

    const result = await deleteAllRecords('u1');

    expect(result).toEqual({ deleted: 7 });
  });
});
