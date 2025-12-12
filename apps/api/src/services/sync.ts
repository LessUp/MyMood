import type { MoodRecordMap } from '@moodflow/types';
import { MoodRecord } from '../models/MoodRecord';

export async function getAllRecords(userId: string): Promise<MoodRecordMap> {
  const records = await MoodRecord.find({ userId });
  const data: MoodRecordMap = {};
  for (const record of records) {
    data[record.dateKey] = {
      mood: record.mood,
      note: record.note,
      ts: record.ts,
      tags: record.tags
    };
  }
  return data;
}

export async function mergeRecords(userId: string, records: MoodRecordMap): Promise<{ updated: number; created: number }>{
  const entries = Object.entries(records);
  const dateKeys = entries.map(([dateKey]) => dateKey);

  const existingDocs = await MoodRecord.find(
    { userId, dateKey: { $in: dateKeys } },
    { dateKey: 1, ts: 1 }
  );
  const existingTsByKey = new Map<string, number>();
  for (const doc of existingDocs) {
    existingTsByKey.set(doc.dateKey, doc.ts);
  }

  const ops: any[] = [];
  let updated = 0;
  let created = 0;

  for (const [dateKey, entry] of entries) {
    const mood = entry?.mood || '';
    const note = entry?.note || '';
    const tags = entry?.tags || [];
    const ts = entry?.ts || 0;

    if (!mood && !note) {
      ops.push({ deleteOne: { filter: { userId, dateKey } } });
      continue;
    }

    const existingTs = existingTsByKey.get(dateKey);

    if (existingTs !== undefined) {
      if (ts > existingTs) {
        ops.push({
          updateOne: {
            filter: { userId, dateKey },
            update: { $set: { mood, note, tags, ts } }
          }
        });
        updated++;
      }
    } else {
      ops.push({
        insertOne: {
          document: { userId, dateKey, mood, note, tags, ts }
        }
      });
      created++;
    }
  }

  if (ops.length > 0) {
    await MoodRecord.bulkWrite(ops, { ordered: false });
  }

  return { updated, created };
}

export async function upsertRecord(
  userId: string,
  dateKey: string,
  payload: { mood?: string; note?: string; tags?: string[] }
): Promise<{ dateKey: string; mood?: string; note?: string; tags?: string[]; ts: number } | { deleted: true }> {
  const mood = payload.mood || '';
  const note = payload.note || '';
  const tags = payload.tags || [];
  const ts = Date.now();

  if (!mood && !note) {
    await MoodRecord.deleteOne({ userId, dateKey });
    return { deleted: true };
  }

  await MoodRecord.findOneAndUpdate(
    { userId, dateKey },
    { mood, note, tags, ts },
    { upsert: true, new: true }
  );

  return { dateKey, mood, note, tags, ts };
}

export async function deleteRecord(userId: string, dateKey: string): Promise<{ deleted: true }>{
  await MoodRecord.deleteOne({ userId, dateKey });
  return { deleted: true };
}

export async function deleteAllRecords(userId: string): Promise<{ deleted: number }>{
  const result = await MoodRecord.deleteMany({ userId });
  return { deleted: result.deletedCount };
}

export async function getSyncStatus(userId: string): Promise<{ totalRecords: number; lastSyncTs: number }>{
  const count = await MoodRecord.countDocuments({ userId });
  const latest = await MoodRecord.findOne({ userId }).sort({ ts: -1 });
  return { totalRecords: count, lastSyncTs: latest?.ts || 0 };
}
