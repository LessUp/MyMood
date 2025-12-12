/**
 * 同步路由
 */

import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import type { MoodRecordMap } from '@moodflow/types';
import { ok } from '../lib/response';
import {
  deleteAllRecords,
  deleteRecord,
  getAllRecords,
  getSyncStatus,
  mergeRecords,
  upsertRecord
} from '../services/sync';

export const syncRouter = Router();

// 使用认证中间件
syncRouter.use(authenticate);

// 请求验证 schema
const syncRecordsSchema = z.object({
  records: z.record(z.object({
    mood: z.string().optional(),
    note: z.string().optional(),
    ts: z.number(),
    tags: z.array(z.string()).optional()
  }))
});

const dateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const upsertRecordSchema = z.object({
  mood: z.string().optional(),
  note: z.string().optional(),
  tags: z.array(z.string()).optional()
});

/**
 * GET /api/sync/records - 获取所有记录
 */
syncRouter.get('/records', asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  const data = await getAllRecords(userId);
  return ok(res, data);
}));

/**
 * POST /api/sync/records - 上传/合并记录
 */
syncRouter.post('/records', asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { records } = syncRecordsSchema.parse(req.body);
  const result = await mergeRecords(userId, records as MoodRecordMap);
  return ok(res, result);
}));

/**
 * PUT /api/sync/records/:dateKey - 更新单条记录
 */
syncRouter.put('/records/:dateKey', asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const dateKey = dateKeySchema.parse(req.params.dateKey);
  const { mood, note, tags } = upsertRecordSchema.parse(req.body);

  const result = await upsertRecord(userId, dateKey, { mood, note, tags });
  return ok(res, result);
}));

/**
 * DELETE /api/sync/records/:dateKey - 删除单条记录
 */
syncRouter.delete('/records/:dateKey', asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const dateKey = dateKeySchema.parse(req.params.dateKey);

  const result = await deleteRecord(userId, dateKey);
  return ok(res, result);
}));

/**
 * DELETE /api/sync/records - 清空所有记录
 */
syncRouter.delete('/records', asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  const result = await deleteAllRecords(userId);
  return ok(res, result);
}));

/**
 * GET /api/sync/status - 获取同步状态
 */
syncRouter.get('/status', asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  const data = await getSyncStatus(userId);
  return ok(res, data);
}));
