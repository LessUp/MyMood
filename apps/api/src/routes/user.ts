/**
 * 用户路由
 */

import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { ok, fail } from '../lib/response';
import { ErrorCodes } from '../lib/error-codes';
import {
  changePassword,
  deleteAccount,
  exportUserData,
  getSettings,
  updateProfile,
  updateSettings
} from '../services/user';

export const userRouter = Router();

// 使用认证中间件
userRouter.use(authenticate);

// 请求验证 schema
const updateProfileSchema = z.object({
  username: z.string().min(1).max(50).optional(),
  avatar: z.string().url().optional()
});

const updateSettingsSchema = z.object({
  weekStart: z.number().min(0).max(1).optional(),
  emojis: z.array(z.string()).optional(),
  emojiColors: z.record(z.string()).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  accentColor: z.string().optional(),
  language: z.enum(['zh', 'en']).optional(),
  cloudSyncEnabled: z.boolean().optional()
});

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(6)
});

/**
 * PUT /api/user/profile - 更新用户资料
 */
userRouter.put('/profile', asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const data = updateProfileSchema.parse(req.body);

  const profile = await updateProfile(userId, data);
  if (!profile) return fail(res, 404, ErrorCodes.NOT_FOUND, '用户不存在');
  return ok(res, profile);
}));

/**
 * PUT /api/user/settings - 更新用户设置
 */
userRouter.put('/settings', asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const data = updateSettingsSchema.parse(req.body);

  const settings = await updateSettings(userId, data);
  if (!settings) return fail(res, 404, ErrorCodes.NOT_FOUND, '用户不存在');
  return ok(res, settings);
}));

/**
 * GET /api/user/settings - 获取用户设置
 */
userRouter.get('/settings', asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const settings = await getSettings(userId);
  if (!settings) return fail(res, 404, ErrorCodes.NOT_FOUND, '用户不存在');
  return ok(res, settings);
}));

/**
 * PUT /api/user/password - 修改密码
 */
userRouter.put('/password', asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { oldPassword, newPassword } = changePasswordSchema.parse(req.body);

  const result = await changePassword(userId, oldPassword, newPassword);
  if (!result.ok) {
    if (result.reason === 'NOT_FOUND') return fail(res, 404, ErrorCodes.NOT_FOUND, '用户不存在');
    if (result.reason === 'NO_PASSWORD') return fail(res, 400, ErrorCodes.NO_PASSWORD, '该账号未设置密码');
    if (result.reason === 'WRONG_PASSWORD') return fail(res, 400, ErrorCodes.WRONG_PASSWORD, '原密码错误');
  }
  return ok(res, { message: '密码修改成功' });
}));

/**
 * DELETE /api/user/account - 删除账号
 */
userRouter.delete('/account', asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  await deleteAccount(userId);
  return ok(res, { message: '账号已删除' });
}));

/**
 * POST /api/user/export - 导出所有用户数据
 */
userRouter.post('/export', asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  const data = await exportUserData(userId);
  if (!data) return fail(res, 404, ErrorCodes.NOT_FOUND, '用户不存在');
  return ok(res, data);
}));
