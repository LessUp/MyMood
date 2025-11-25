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
authRouter.post('/register', async (req, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);
    const { user, tokens } = await registerByEmail(data.email, data.password, data.username);
    
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          avatar: user.avatar
        },
        tokens
      }
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.errors[0].message }
      });
    }
    
    if (error.message === 'EMAIL_EXISTS') {
      return res.status(400).json({
        success: false,
        error: { code: 'EMAIL_EXISTS', message: '该邮箱已被注册' }
      });
    }
    
    throw error;
  }
});

/**
 * POST /api/auth/login - 邮箱登录
 */
authRouter.post('/login', async (req, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);
    const { user, tokens } = await loginByEmail(data.email, data.password);
    
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          avatar: user.avatar
        },
        tokens
      }
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.errors[0].message }
      });
    }
    
    if (error.message === 'INVALID_CREDENTIALS') {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: '邮箱或密码错误' }
      });
    }
    
    throw error;
  }
});

/**
 * POST /api/auth/wechat - 微信登录
 */
authRouter.post('/wechat', async (req, res: Response) => {
  try {
    const data = wxLoginSchema.parse(req.body);
    const { user, tokens, isNew } = await loginByWechat(data.code);
    
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          avatar: user.avatar
        },
        tokens,
        isNew
      }
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.errors[0].message }
      });
    }
    
    if (error.message === 'WECHAT_NOT_CONFIGURED') {
      return res.status(500).json({
        success: false,
        error: { code: 'WECHAT_NOT_CONFIGURED', message: '微信登录未配置' }
      });
    }
    
    if (error.message === 'WECHAT_AUTH_FAILED') {
      return res.status(401).json({
        success: false,
        error: { code: 'WECHAT_AUTH_FAILED', message: '微信认证失败' }
      });
    }
    
    throw error;
  }
});

/**
 * POST /api/auth/refresh - 刷新令牌
 */
authRouter.post('/refresh', async (req, res: Response) => {
  try {
    const data = refreshSchema.parse(req.body);
    const tokens = refreshTokens(data.refreshToken);
    
    res.json({
      success: true,
      data: { tokens }
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.errors[0].message }
      });
    }
    
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_REFRESH_TOKEN', message: '无效的刷新令牌' }
    });
  }
});

/**
 * GET /api/auth/me - 获取当前用户信息
 */
authRouter.get('/me', authenticate, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  
  res.json({
    success: true,
    data: {
      id: user._id,
      email: user.email,
      phone: user.phone,
      username: user.username,
      avatar: user.avatar,
      settings: user.settings,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }
  });
});

/**
 * POST /api/auth/logout - 登出（客户端清除令牌即可）
 */
authRouter.post('/logout', authenticate, (_req, res: Response) => {
  // 实际登出逻辑可以在这里添加令牌黑名单
  res.json({
    success: true,
    data: { message: '已登出' }
  });
});
