/**
 * 存储管理器 - 平台无关的数据存储逻辑
 */

import type { 
  MoodEntry, 
  MoodRecordMap, 
  DateKey, 
  StorageAdapter,
  MergeDiff 
} from '@moodflow/types';

const STORAGE_KEY_V2 = 'mood_records_v2';

/**
 * 存储管理器
 */
export class StorageManager {
  private adapter: StorageAdapter;
  private cache: MoodRecordMap | null = null;
  private onChangeCallback?: () => void;

  constructor(adapter: StorageAdapter) {
    this.adapter = adapter;
  }

  /**
   * 设置数据变更回调
   */
  onChange(callback: () => void): void {
    this.onChangeCallback = callback;
  }

  /**
   * 触发变更通知
   */
  private notifyChange(): void {
    if (this.onChangeCallback) {
      this.onChangeCallback();
    }
  }

  /**
   * 获取所有记录
   */
  async getAllEntries(): Promise<MoodRecordMap> {
    if (this.cache) return this.cache;
    
    const data = await this.adapter.get<MoodRecordMap>(STORAGE_KEY_V2);
    this.cache = data || {};
    return this.cache;
  }

  /**
   * 获取单条记录
   */
  async getEntry(dateKey: DateKey): Promise<MoodEntry | null> {
    const all = await this.getAllEntries();
    return all[dateKey] || null;
  }

  /**
   * 获取心情映射 (dateKey -> mood)
   */
  async getMoodMap(): Promise<Record<string, string>> {
    const all = await this.getAllEntries();
    const result: Record<string, string> = {};
    for (const key in all) {
      if (all[key]?.mood) {
        result[key] = all[key].mood;
      }
    }
    return result;
  }

  /**
   * 设置心情
   */
  async setMood(dateKey: DateKey, mood: string): Promise<void> {
    const all = await this.getAllEntries();
    
    if (mood) {
      all[dateKey] = {
        ...all[dateKey],
        mood,
        ts: Date.now()
      };
    } else if (all[dateKey]) {
      if (all[dateKey].note) {
        delete (all[dateKey] as Partial<MoodEntry>).mood;
        all[dateKey].ts = Date.now();
      } else {
        delete all[dateKey];
      }
    }
    
    await this.save(all);
    this.notifyChange();
  }

  /**
   * 设置备注
   */
  async setNote(dateKey: DateKey, note: string): Promise<void> {
    const all = await this.getAllEntries();
    
    if (note) {
      all[dateKey] = {
        ...all[dateKey],
        note,
        ts: Date.now()
      };
    } else if (all[dateKey]) {
      if (all[dateKey].mood) {
        delete (all[dateKey] as Partial<MoodEntry>).note;
        all[dateKey].ts = Date.now();
      } else {
        delete all[dateKey];
      }
    }
    
    await this.save(all);
    this.notifyChange();
  }

  /**
   * 清除单条记录
   */
  async clearEntry(dateKey: DateKey): Promise<void> {
    const all = await this.getAllEntries();
    delete all[dateKey];
    await this.save(all);
    this.notifyChange();
  }

  /**
   * 清除所有数据
   */
  async clearAll(): Promise<void> {
    this.cache = {};
    await this.adapter.remove(STORAGE_KEY_V2);
    this.notifyChange();
  }

  /**
   * 计算合并差异
   */
  async getMergeDiff(entries: MoodRecordMap): Promise<MergeDiff> {
    const current = await this.getAllEntries();
    const result: MergeDiff = { added: 0, updated: 0, deleted: 0 };
    
    for (const key in entries) {
      if (key.startsWith('__')) continue;
      
      const incoming = entries[key];
      if (!incoming) continue;
      
      const { mood = '', note = '', ts = 0 } = incoming;
      const cur = current[key];
      const curTs = cur?.ts || 0;
      
      if (ts <= curTs) continue;
      
      if (!cur) {
        if (mood || note) result.added++;
      } else if (mood || note) {
        result.updated++;
      } else {
        result.deleted++;
      }
    }
    
    return result;
  }

  /**
   * 合并记录（后写优先）
   */
  async mergeEntries(entries: MoodRecordMap): Promise<{ updated: number }> {
    const all = await this.getAllEntries();
    let updated = 0;
    
    for (const key in entries) {
      if (key.startsWith('__')) continue;
      
      const entry = entries[key];
      if (!entry) continue;
      
      const { mood = '', note = '', ts = 0 } = entry;
      const cur = all[key];
      const curTs = cur?.ts || 0;
      
      if (ts > curTs) {
        if (mood || note) {
          all[key] = { mood, note, ts };
        } else {
          delete all[key];
        }
        updated++;
      }
    }
    
    await this.save(all);
    if (updated > 0) {
      this.notifyChange();
    }
    
    return { updated };
  }

  /**
   * 批量设置记录（导入用）
   */
  async importEntries(entries: MoodRecordMap, overwrite = false): Promise<{ imported: number }> {
    if (overwrite) {
      this.cache = entries;
      await this.save(entries);
      this.notifyChange();
      return { imported: Object.keys(entries).length };
    }
    
    const { updated } = await this.mergeEntries(entries);
    return { imported: updated };
  }

  /**
   * 保存到存储
   */
  private async save(data: MoodRecordMap): Promise<void> {
    this.cache = data;
    await this.adapter.set(STORAGE_KEY_V2, data);
  }

  /**
   * 刷新缓存
   */
  async refresh(): Promise<void> {
    this.cache = null;
    await this.getAllEntries();
  }
}

/**
 * 创建存储管理器
 */
export function createStorageManager(adapter: StorageAdapter): StorageManager {
  return new StorageManager(adapter);
}
