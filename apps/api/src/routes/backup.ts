/**
 * 备份路由
 */

import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Backup } from '../models/Backup';
import { MoodRecord } from '../models/MoodRecord';
import type { MoodRecordMap, BackupRecord } from '@moodflow/types';

export const backupRouter = Router();

// 使用认证中间件
backupRouter.use(authenticate);

// 请求验证 schema
const createBackupSchema = z.object({
  note: z.string().optional()
});

/**
 * GET /api/backup/list - 获取备份列表
 */
backupRouter.get('/list', async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const limit = parseInt(req.query.limit as string) || 10;
  
  const backups = await Backup.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('-payload'); // 不返回完整数据
  
  const list: Omit<BackupRecord, 'userId'>[] = backups.map(b => ({
    id: b._id.toString(),
    createdAt: b.createdAt.getTime(),
    note: b.note,
    summary: b.summary,
    size: b.size
  }));
  
  res.json({
    success: true,
    data: list
  });
});

/**
 * POST /api/backup/create - 创建备份
 */
backupRouter.post('/create', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { note } = createBackupSchema.parse(req.body);
    
    // 获取所有记录
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
    
    res.status(201).json({
      success: true,
      data: {
        id: backup._id.toString(),
        createdAt: backup.createdAt.getTime(),
        note: backup.note,
        summary: backup.summary,
        size: backup.size
      }
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
 * GET /api/backup/:id - 获取备份详情
 */
backupRouter.get('/:id', async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;
  
  const backup = await Backup.findOne({ _id: id, userId });
  
  if (!backup) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: '备份不存在' }
    });
  }
  
  res.json({
    success: true,
    data: {
      id: backup._id.toString(),
      createdAt: backup.createdAt.getTime(),
      note: backup.note,
      summary: backup.summary,
      size: backup.size,
      payload: JSON.parse(backup.payload)
    }
  });
});

/**
 * POST /api/backup/:id/restore - 恢复备份
 */
backupRouter.post('/:id/restore', async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;
  const { overwrite } = req.body;
  
  const backup = await Backup.findOne({ _id: id, userId });
  
  if (!backup) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: '备份不存在' }
    });
  }
  
  const backupData: MoodRecordMap = JSON.parse(backup.payload);
  
  let restored = 0;
  let skipped = 0;
  
  if (overwrite) {
    // 覆盖模式：清空后导入
    await MoodRecord.deleteMany({ userId });
    
    for (const [dateKey, entry] of Object.entries(backupData)) {
      await MoodRecord.create({
        userId,
        dateKey,
        mood: entry.mood,
        note: entry.note || '',
        tags: entry.tags || [],
        ts: entry.ts
      });
      restored++;
    }
  } else {
    // 合并模式：后写优先
    for (const [dateKey, entry] of Object.entries(backupData)) {
      const existing = await MoodRecord.findOne({ userId, dateKey });
      
      if (existing && existing.ts >= entry.ts) {
        skipped++;
        continue;
      }
      
      await MoodRecord.findOneAndUpdate(
        { userId, dateKey },
        {
          mood: entry.mood,
          note: entry.note || '',
          tags: entry.tags || [],
          ts: entry.ts
        },
        { upsert: true }
      );
      restored++;
    }
  }
  
  res.json({
    success: true,
    data: { restored, skipped }
  });
});

/**
 * DELETE /api/backup/:id - 删除备份
 */
backupRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;
  
  const result = await Backup.deleteOne({ _id: id, userId });
  
  if (result.deletedCount === 0) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: '备份不存在' }
    });
  }
  
  res.json({
    success: true,
    data: { deleted: true }
  });
});

/**
 * GET /api/backup/:id/download - 下载备份
 */
backupRouter.get('/:id/download', async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;
  
  const backup = await Backup.findOne({ _id: id, userId });
  
  if (!backup) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: '备份不存在' }
    });
  }
  
  const filename = `moodflow_backup_${backup.createdAt.toISOString().split('T')[0]}.json`;
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(backup.payload);
});
