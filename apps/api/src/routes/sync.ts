/**
 * 同步路由
 */

import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { MoodRecord } from '../models/MoodRecord';
import type { MoodRecordMap } from '@moodflow/types';

export const syncRouter = Router();

// 使用认证中间件
syncRouter.use(authenticate);

// 请求验证 schema
const syncRecordsSchema = z.object({
  records: z.record(z.object({
    mood: z.string(),
    note: z.string().optional(),
    ts: z.number(),
    tags: z.array(z.string()).optional()
  }))
});

/**
 * GET /api/sync/records - 获取所有记录
 */
syncRouter.get('/records', async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  
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
  
  res.json({
    success: true,
    data
  });
});

/**
 * POST /api/sync/records - 上传/合并记录
 */
syncRouter.post('/records', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { records } = syncRecordsSchema.parse(req.body);
    
    let updated = 0;
    let created = 0;
    
    for (const [dateKey, entry] of Object.entries(records)) {
      if (!entry.mood && !entry.note) {
        // 空记录，删除
        await MoodRecord.deleteOne({ userId, dateKey });
        continue;
      }
      
      const existing = await MoodRecord.findOne({ userId, dateKey });
      
      if (existing) {
        // 后写优先合并
        if (entry.ts > existing.ts) {
          await MoodRecord.updateOne(
            { userId, dateKey },
            { 
              mood: entry.mood,
              note: entry.note || '',
              tags: entry.tags || [],
              ts: entry.ts
            }
          );
          updated++;
        }
      } else {
        // 创建新记录
        await MoodRecord.create({
          userId,
          dateKey,
          mood: entry.mood,
          note: entry.note || '',
          tags: entry.tags || [],
          ts: entry.ts
        });
        created++;
      }
    }
    
    res.json({
      success: true,
      data: { updated, created }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.errors[0].message }
      });
    }
    throw error;
  }
});

/**
 * PUT /api/sync/records/:dateKey - 更新单条记录
 */
syncRouter.put('/records/:dateKey', async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { dateKey } = req.params;
  const { mood, note, tags } = req.body;
  
  const ts = Date.now();
  
  if (!mood && !note) {
    // 删除记录
    await MoodRecord.deleteOne({ userId, dateKey });
    return res.json({
      success: true,
      data: { deleted: true }
    });
  }
  
  await MoodRecord.findOneAndUpdate(
    { userId, dateKey },
    { mood, note: note || '', tags: tags || [], ts },
    { upsert: true, new: true }
  );
  
  res.json({
    success: true,
    data: { dateKey, mood, note, tags, ts }
  });
});

/**
 * DELETE /api/sync/records/:dateKey - 删除单条记录
 */
syncRouter.delete('/records/:dateKey', async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { dateKey } = req.params;
  
  await MoodRecord.deleteOne({ userId, dateKey });
  
  res.json({
    success: true,
    data: { deleted: true }
  });
});

/**
 * DELETE /api/sync/records - 清空所有记录
 */
syncRouter.delete('/records', async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  
  const result = await MoodRecord.deleteMany({ userId });
  
  res.json({
    success: true,
    data: { deleted: result.deletedCount }
  });
});

/**
 * GET /api/sync/status - 获取同步状态
 */
syncRouter.get('/status', async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  
  const count = await MoodRecord.countDocuments({ userId });
  const latest = await MoodRecord.findOne({ userId }).sort({ ts: -1 });
  
  res.json({
    success: true,
    data: {
      totalRecords: count,
      lastSyncTs: latest?.ts || 0
    }
  });
});
