import type { BackupRecord, MoodEntry, MoodRecordMap } from '@moodflow/types';
import { Backup } from '../models/Backup';
import { MoodRecord } from '../models/MoodRecord';

export async function listBackups(userId: string, limit = 10): Promise<Omit<BackupRecord, 'userId'>[]> {
  const backups = await Backup.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('-payload');

  return backups.map((b) => ({
    id: b._id.toString(),
    createdAt: b.createdAt.getTime(),
    note: b.note,
    summary: b.summary,
    size: b.size
  }));
}

export async function createBackup(userId: string, note?: string): Promise<{
  id: string;
  createdAt: number;
  note: string;
  summary: any;
  size: number;
}> {
  const records = await MoodRecord.find({ userId });

  const data: MoodRecordMap = {};
  let minDate = '';
  let maxDate = '';

  for (const record of records) {
    data[record.dateKey] = {
      mood: record.mood,
      note: record.note,
      ts: record.ts,
      tags: record.tags
    };

    if (!minDate || record.dateKey < minDate) minDate = record.dateKey;
    if (!maxDate || record.dateKey > maxDate) maxDate = record.dateKey;
  }

  const payload = JSON.stringify(data);

  const backup = await Backup.create({
    userId,
    note: note || '',
    summary: {
      total: records.length,
      dateRange: records.length > 0 ? { start: minDate, end: maxDate } : undefined
    },
    payload,
    size: Buffer.byteLength(payload, 'utf8')
  });

  return {
    id: backup._id.toString(),
    createdAt: backup.createdAt.getTime(),
    note: backup.note,
    summary: backup.summary,
    size: backup.size
  };
}

export async function getBackupDetail(userId: string, id: string): Promise<{
  id: string;
  createdAt: number;
  note: string;
  summary: any;
  size: number;
  payload: MoodRecordMap;
} | null> {
  const backup = await Backup.findOne({ _id: id, userId });
  if (!backup) return null;

  return {
    id: backup._id.toString(),
    createdAt: backup.createdAt.getTime(),
    note: backup.note,
    summary: backup.summary,
    size: backup.size,
    payload: JSON.parse(backup.payload) as MoodRecordMap
  };
}

export async function restoreBackup(
  userId: string,
  id: string,
  overwrite?: boolean
): Promise<{ restored: number; skipped: number } | null> {
  const backup = await Backup.findOne({ _id: id, userId });
  if (!backup) return null;

  const backupData: MoodRecordMap = JSON.parse(backup.payload);
  const backupEntries = Object.entries(backupData) as Array<[string, MoodEntry]>;

  let restored = 0;
  let skipped = 0;

  if (overwrite) {
    await MoodRecord.deleteMany({ userId });

    for (const [dateKey, entry] of backupEntries) {
      await MoodRecord.create({
        userId,
        dateKey,
        mood: entry.mood || '',
        note: entry.note || '',
        tags: entry.tags || [],
        ts: entry.ts
      });
      restored++;
    }
  } else {
    for (const [dateKey, entry] of backupEntries) {
      const existing = await MoodRecord.findOne({ userId, dateKey });

      if (existing && existing.ts >= entry.ts) {
        skipped++;
        continue;
      }

      await MoodRecord.findOneAndUpdate(
        { userId, dateKey },
        {
          mood: entry.mood || '',
          note: entry.note || '',
          tags: entry.tags || [],
          ts: entry.ts
        },
        { upsert: true }
      );
      restored++;
    }
  }

  return { restored, skipped };
}

export async function deleteBackup(userId: string, id: string): Promise<boolean> {
  const result = await Backup.deleteOne({ _id: id, userId });
  return result.deletedCount > 0;
}

export async function getBackupDownload(userId: string, id: string): Promise<{ filename: string; payload: string } | null> {
  const backup = await Backup.findOne({ _id: id, userId });
  if (!backup) return null;

  const filename = `moodflow_backup_${backup.createdAt.toISOString().split('T')[0]}.json`;
  return { filename, payload: backup.payload };
}
