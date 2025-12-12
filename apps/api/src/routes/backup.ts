/**
 * 备份路由
 */

import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { ok, fail } from '../lib/response';
import { ErrorCodes } from '../lib/error-codes';
import {
  createBackup,
  deleteBackup,
  getBackupDetail,
  getBackupDownload,
  listBackups,
  restoreBackup
} from '../services/backup';

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
backupRouter.get('/list', asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const limit = parseInt(req.query.limit as string) || 10;

  const list = await listBackups(userId, limit);
  return ok(res, list);
}));

/**
 * POST /api/backup/create - 创建备份
 */
backupRouter.post('/create', asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { note } = createBackupSchema.parse(req.body);
  const data = await createBackup(userId, note);
  return ok(res, data, 201);
}));

/**
 * GET /api/backup/:id - 获取备份详情
 */
backupRouter.get('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;

  const detail = await getBackupDetail(userId, id);
  if (!detail) return fail(res, 404, ErrorCodes.NOT_FOUND, '备份不存在');
  return ok(res, detail);
}));

/**
 * POST /api/backup/:id/restore - 恢复备份
 */
backupRouter.post('/:id/restore', asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;
  const { overwrite } = req.body;

  const result = await restoreBackup(userId, id, overwrite);
  if (!result) return fail(res, 404, ErrorCodes.NOT_FOUND, '备份不存在');
  return ok(res, result);
}));

/**
 * DELETE /api/backup/:id - 删除备份
 */
backupRouter.delete('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;

  const deleted = await deleteBackup(userId, id);
  if (!deleted) return fail(res, 404, ErrorCodes.NOT_FOUND, '备份不存在');
  return ok(res, { deleted: true });
}));

/**
 * GET /api/backup/:id/download - 下载备份
 */
backupRouter.get('/:id/download', asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;

  const download = await getBackupDownload(userId, id);
  if (!download) return fail(res, 404, ErrorCodes.NOT_FOUND, '备份不存在');

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${download.filename}"`);
  res.send(download.payload);
}));
