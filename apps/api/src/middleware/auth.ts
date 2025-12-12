/**
 * 认证中间件
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { JWT_SECRET } from '../config/jwt';
import { fail } from '../lib/response';
import { ErrorCodes } from '../lib/error-codes';

export interface AuthRequest extends Request {
  user?: IUser;
  userId?: string;
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return fail(res, 401, ErrorCodes.UNAUTHORIZED, '未提供认证令牌');
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return fail(res, 401, ErrorCodes.USER_NOT_FOUND, '用户不存在');
    }
    
    req.user = user;
    req.userId = user._id.toString();
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return fail(res, 401, ErrorCodes.TOKEN_EXPIRED, '令牌已过期');
    }
    
    return fail(res, 401, ErrorCodes.INVALID_TOKEN, '无效的认证令牌');
  }
}

/**
 * 可选认证（不强制要求登录）
 */
export async function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      const user = await User.findById(decoded.userId);
      
      if (user) {
        req.user = user;
        req.userId = user._id.toString();
      }
    }
    
    next();
  } catch {
    // 忽略错误，继续无认证状态
    next();
  }
}
