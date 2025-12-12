/**
 * 认证路由
 */

import { Router, Response } from 'express';
import { z } from 'zod';
import { 
  registerByEmail, 
  loginByEmail, 
  loginByWechat,
  refreshTokens 
} from '../services/auth';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { ok } from '../lib/response';

export const authRouter = Router();

// 请求验证 schema
const registerSchema = z.object({
  email: z.string().email('无效的邮箱格式'),
  password: z.string().min(6, '密码至少6个字符'),
  username: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email('无效的邮箱格式'),
  password: z.string().min(1, '请输入密码')
});

const wxLoginSchema = z.object({
  code: z.string().min(1, '请提供微信登录 code')
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, '请提供刷新令牌')
});

/**
 * POST /api/auth/register - 邮箱注册
 */
authRouter.post('/register', asyncHandler(async (req, res: Response) => {
  const data = registerSchema.parse(req.body);
  const { user, tokens } = await registerByEmail(data.email, data.password, data.username);

  return ok(res, {
    user: {
      id: user._id,
      email: user.email,
      username: user.username,
      avatar: user.avatar
    },
    tokens
  }, 201);
}));

/**
 * POST /api/auth/login - 邮箱登录
 */
authRouter.post('/login', asyncHandler(async (req, res: Response) => {
  const data = loginSchema.parse(req.body);
  const { user, tokens } = await loginByEmail(data.email, data.password);

  return ok(res, {
    user: {
      id: user._id,
      email: user.email,
      username: user.username,
      avatar: user.avatar
    },
    tokens
  });
}));

/**
 * POST /api/auth/wechat - 微信登录
 */
authRouter.post('/wechat', asyncHandler(async (req, res: Response) => {
  const data = wxLoginSchema.parse(req.body);
  const { user, tokens, isNew } = await loginByWechat(data.code);

  return ok(res, {
    user: {
      id: user._id,
      username: user.username,
      avatar: user.avatar
    },
    tokens,
    isNew
  });
}));

/**
 * POST /api/auth/refresh - 刷新令牌
 */
authRouter.post('/refresh', asyncHandler(async (req, res: Response) => {
  const data = refreshSchema.parse(req.body);
  const tokens = refreshTokens(data.refreshToken);
  return ok(res, { tokens });
}));

/**
 * GET /api/auth/me - 获取当前用户信息
 */
authRouter.get('/me', authenticate, (req: AuthRequest, res: Response) => {
  const user = req.user!;

  return ok(res, {
    id: user._id,
    email: user.email,
    phone: user.phone,
    username: user.username,
    avatar: user.avatar,
    settings: user.settings,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  });
});

/**
 * POST /api/auth/logout - 登出（客户端清除令牌即可）
 */
authRouter.post('/logout', authenticate, (_req, res: Response) => {
  // 实际登出逻辑可以在这里添加令牌黑名单
  return ok(res, { message: '已登出' });
});
