/**
 * 错误处理中间件
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ErrorCodes } from '../lib/error-codes';

export class ApiError extends Error {
  statusCode: number;
  code: string;
  
  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('API Error:', err);

  if (err instanceof z.ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: ErrorCodes.VALIDATION_ERROR,
        message: err.errors[0]?.message || '参数校验失败'
      }
    });
  }

  if (err.message === 'JWT_SECRET_NOT_CONFIGURED') {
    return res.status(500).json({
      success: false,
      error: {
        code: ErrorCodes.INTERNAL_ERROR,
        message: '服务端 JWT 配置缺失'
      }
    });
  }

  if (err.message === 'EMAIL_EXISTS') {
    return res.status(400).json({
      success: false,
      error: { code: ErrorCodes.EMAIL_EXISTS, message: '该邮箱已被注册' }
    });
  }

  if (err.message === 'INVALID_CREDENTIALS') {
    return res.status(401).json({
      success: false,
      error: { code: ErrorCodes.INVALID_CREDENTIALS, message: '邮箱或密码错误' }
    });
  }

  if (err.message === 'INVALID_REFRESH_TOKEN') {
    return res.status(401).json({
      success: false,
      error: { code: ErrorCodes.INVALID_REFRESH_TOKEN, message: '无效的刷新令牌' }
    });
  }

  if (err.message === 'WECHAT_NOT_CONFIGURED') {
    return res.status(500).json({
      success: false,
      error: { code: ErrorCodes.WECHAT_NOT_CONFIGURED, message: '微信登录未配置' }
    });
  }

  if (err.message === 'WECHAT_AUTH_FAILED') {
    return res.status(401).json({
      success: false,
      error: { code: ErrorCodes.WECHAT_AUTH_FAILED, message: '微信认证失败' }
    });
  }
  
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message
      }
    });
  }
  
  // MongoDB 重复键错误
  if ((err as any).code === 11000) {
    return res.status(400).json({
      success: false,
      error: {
        code: ErrorCodes.DUPLICATE_KEY,
        message: '数据已存在'
      }
    });
  }
  
  // 默认服务器错误
  return res.status(500).json({
    success: false,
    error: {
      code: ErrorCodes.INTERNAL_ERROR,
      message: process.env.NODE_ENV === 'production' 
        ? '服务器内部错误' 
        : err.message
    }
  });
}
