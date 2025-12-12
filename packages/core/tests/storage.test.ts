import { describe, expect, it, vi } from 'vitest';
import { createStorageManager } from '../src/storage';
import type { StorageAdapter, MoodRecordMap } from '@moodflow/types';

const createMemoryAdapter = (initial: MoodRecordMap = {}): StorageAdapter => {
  let store: Record<string, unknown> = initial ? { mood_records_v2: initial } : {};
  return {
    async get(key) {
      return (store[key] as MoodRecordMap) || null;
    },
    async set(key, value) {
      store[key] = value;
    },
    async remove(key) {
      delete store[key];
    }
  };
};

describe('StorageManager', () => {
  it('sets mood and note while notifying changes', async () => {
    const adapter = createMemoryAdapter();
    const manager = createStorageManager(adapter);
    const onChange = vi.fn();
    manager.onChange(onChange);

    await manager.setMood('2024-01-01', 'happy');
    await manager.setNote('2024-01-01', 'New Year');

    const entry = await manager.getEntry('2024-01-01');
    expect(entry?.mood).toBe('happy');
    expect(entry?.note).toBe('New Year');
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('merges records with timestamp priority', async () => {
    const adapter = createMemoryAdapter({
      '2024-01-01': { mood: 'happy', ts: 1 },
      '2024-01-02': { mood: 'sad', ts: 5 }
    });
    const manager = createStorageManager(adapter);

    const { updated } = await manager.mergeEntries({
      '2024-01-01': { mood: 'angry', ts: 2 },
      '2024-01-02': { mood: 'sad', ts: 4 },
      '2024-01-03': { mood: 'calm', ts: 3 }
    });

    expect(updated).toBe(2);
    const all = await manager.getAllEntries();
    expect(all['2024-01-01'].mood).toBe('angry');
    expect(all['2024-01-02'].mood).toBe('sad');
    expect(all['2024-01-03'].mood).toBe('calm');
  });

  it('computes merge diff correctly', async () => {
    const adapter = createMemoryAdapter({
      '2024-01-01': { mood: 'happy', ts: 1 },
      '2024-01-02': { mood: 'sad', ts: 2 }
    });
    const manager = createStorageManager(adapter);

    const diff = await manager.getMergeDiff({
      '2024-01-01': { mood: 'happy', ts: 1 },
      '2024-01-02': { mood: 'joy', ts: 3 },
      '2024-01-03': { mood: 'calm', ts: 1 }
    });

    expect(diff).toEqual({ added: 1, updated: 1, deleted: 0 });
  });

  it('imports entries with overwrite flag', async () => {
    const adapter = createMemoryAdapter({
      '2024-01-01': { mood: 'happy', ts: 1 }
    });
    const manager = createStorageManager(adapter);

    const { imported } = await manager.importEntries(
      {
        '2024-01-02': { mood: 'calm', ts: 2 },
        '2024-01-03': { mood: 'sad', ts: 3 }
      },
      true
    );

    expect(imported).toBe(2);
    const all = await manager.getAllEntries();
    expect(all['2024-01-01']).toBeUndefined();
    expect(all['2024-01-02'].mood).toBe('calm');
  });
});
