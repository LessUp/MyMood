/**
 * 用户路由
 */

import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { hashPassword, verifyPassword } from '../services/auth';

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
userRouter.put('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const data = updateProfileSchema.parse(req.body);
    
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: data },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: '用户不存在' }
      });
    }
    
    res.json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        avatar: user.avatar
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
 * PUT /api/user/settings - 更新用户设置
 */
userRouter.put('/settings', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const data = updateSettingsSchema.parse(req.body);
    
    // 构建更新对象
    const updateFields: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        updateFields[`settings.${key}`] = value;
      }
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: '用户不存在' }
      });
    }
    
    res.json({
      success: true,
      data: user.settings
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
 * GET /api/user/settings - 获取用户设置
 */
userRouter.get('/settings', async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  
  res.json({
    success: true,
    data: user.settings
  });
});

/**
 * PUT /api/user/password - 修改密码
 */
userRouter.put('/password', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { oldPassword, newPassword } = changePasswordSchema.parse(req.body);
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: '用户不存在' }
      });
    }
    
    if (!user.password) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_PASSWORD', message: '该账号未设置密码' }
      });
    }
    
    const valid = await verifyPassword(oldPassword, user.password);
    if (!valid) {
      return res.status(400).json({
        success: false,
        error: { code: 'WRONG_PASSWORD', message: '原密码错误' }
      });
    }
    
    const hashedPassword = await hashPassword(newPassword);
    await User.findByIdAndUpdate(userId, { password: hashedPassword });
    
    res.json({
      success: true,
      data: { message: '密码修改成功' }
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
 * DELETE /api/user/account - 删除账号
 */
userRouter.delete('/account', async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  
  // 删除用户所有数据
  const { MoodRecord } = await import('../models/MoodRecord');
  const { Backup } = await import('../models/Backup');
  
  await MoodRecord.deleteMany({ userId });
  await Backup.deleteMany({ userId });
  await User.findByIdAndDelete(userId);
  
  res.json({
    success: true,
    data: { message: '账号已删除' }
  });
});

/**
 * POST /api/user/export - 导出所有用户数据
 */
userRouter.post('/export', async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const user = req.user!;
  
  const { MoodRecord } = await import('../models/MoodRecord');
  const records = await MoodRecord.find({ userId });
  
  const moodData: Record<string, any> = {};
  for (const record of records) {
    moodData[record.dateKey] = {
      mood: record.mood,
      note: record.note,
      ts: record.ts,
      tags: record.tags
    };
  }
  
  const exportData = {
    version: '2.0.0',
    exportedAt: Date.now(),
    user: {
      username: user.username,
      email: user.email
    },
    settings: user.settings,
    records: moodData
  };
  
  res.json({
    success: true,
    data: exportData
  });
});
