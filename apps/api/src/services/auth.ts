/**
 * 认证服务
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, IUser } from '../models/User';
import type { AuthToken } from '@moodflow/types';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

/**
 * 生成令牌对
 */
export function generateTokens(userId: string): AuthToken {
  const accessToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign({ userId, type: 'refresh' }, JWT_REFRESH_SECRET, { 
    expiresIn: JWT_REFRESH_EXPIRES_IN 
  });
  
  // 计算过期时间
  const decoded = jwt.decode(accessToken) as { exp: number };
  
  return {
    accessToken,
    refreshToken,
    expiresAt: decoded.exp * 1000
  };
}

/**
 * 刷新令牌
 */
export function refreshTokens(refreshToken: string): AuthToken {
  const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { 
    userId: string; 
    type: string 
  };
  
  if (decoded.type !== 'refresh') {
    throw new Error('INVALID_REFRESH_TOKEN');
  }
  
  return generateTokens(decoded.userId);
}

/**
 * 哈希密码
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * 验证密码
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * 邮箱注册
 */
export async function registerByEmail(
  email: string,
  password: string,
  username?: string
): Promise<{ user: IUser; tokens: AuthToken }> {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new Error('EMAIL_EXISTS');
  }
  
  const hashedPassword = await hashPassword(password);
  
  const user = new User({
    email,
    password: hashedPassword,
    username: username || email.split('@')[0]
  });
  
  await user.save();
  const tokens = generateTokens(user._id.toString());
  
  return { user, tokens };
}

/**
 * 邮箱登录
 */
export async function loginByEmail(
  email: string,
  password: string
): Promise<{ user: IUser; tokens: AuthToken }> {
  const user = await User.findOne({ email });
  if (!user || !user.password) {
    throw new Error('INVALID_CREDENTIALS');
  }
  
  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    throw new Error('INVALID_CREDENTIALS');
  }
  
  const tokens = generateTokens(user._id.toString());
  
  return { user, tokens };
}

/**
 * 微信登录
 */
export async function loginByWechat(
  wxCode: string
): Promise<{ user: IUser; tokens: AuthToken; isNew: boolean }> {
  // 调用微信 API 获取 openid
  const wxAppId = process.env.WX_APP_ID;
  const wxAppSecret = process.env.WX_APP_SECRET;
  
  if (!wxAppId || !wxAppSecret) {
    throw new Error('WECHAT_NOT_CONFIGURED');
  }
  
  const wxUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${wxAppId}&secret=${wxAppSecret}&js_code=${wxCode}&grant_type=authorization_code`;
  
  const response = await fetch(wxUrl);
  const data = await response.json() as { openid?: string; errcode?: number };
  
  if (data.errcode || !data.openid) {
    throw new Error('WECHAT_AUTH_FAILED');
  }
  
  const wxOpenId = data.openid;
  
  // 查找或创建用户
  let user = await User.findOne({ wxOpenId });
  let isNew = false;
  
  if (!user) {
    user = new User({
      wxOpenId,
      username: `用户${Date.now().toString(36)}`
    });
    await user.save();
    isNew = true;
  }
  
  const tokens = generateTokens(user._id.toString());
  
  return { user, tokens, isNew };
}
