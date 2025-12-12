/**
 * MoodFlow 共享类型定义
 */

// ========== 基础数据类型 ==========

/** 心情记录条目 */
export interface MoodEntry {
  /** 心情表情符号 */
  mood?: string;
  /** 备注文本 */
  note?: string;
  /** 时间戳（毫秒），用于冲突解决 */
  ts: number;
  /** 关联标签 */
  tags?: string[];
}

/** 心情记录映射 dateKey -> MoodEntry */
export type MoodRecordMap = Record<string, MoodEntry>;

/** 日期键格式 YYYY-MM-DD */
export type DateKey = string;

// ========== 用户与账号 ==========

/** 用户信息 */
export interface User {
  /** 用户唯一ID */
  id: string;
  /** 用户名 */
  username?: string;
  /** 邮箱 */
  email?: string;
  /** 手机号 */
  phone?: string;
  /** 头像URL */
  avatar?: string;
  /** 微信 OpenID（小程序登录） */
  wxOpenId?: string;
  /** 创建时间 */
  createdAt: number;
  /** 更新时间 */
  updatedAt: number;
}

/** 登录凭证 */
export interface AuthToken {
  /** 访问令牌 */
  accessToken: string;
  /** 刷新令牌 */
  refreshToken: string;
  /** 过期时间戳 */
  expiresAt: number;
}

/** 登录方式 */
export type AuthProvider = 'email' | 'phone' | 'wechat';

/** 登录请求 */
export interface LoginRequest {
  provider: AuthProvider;
  /** 邮箱/手机号登录 */
  credential?: string;
  password?: string;
  /** 验证码登录 */
  code?: string;
  /** 微信登录 code */
  wxCode?: string;
}

/** 注册请求 */
export interface RegisterRequest {
  email?: string;
  phone?: string;
  password: string;
  username?: string;
  /** 验证码 */
  verifyCode: string;
}

// ========== 设置 ==========

/** 用户设置 */
export interface UserSettings {
  /** 周起始日 0=周日 1=周一 */
  weekStart: 0 | 1;
  /** 可用表情列表 */
  emojis: string[];
  /** 表情对应颜色映射 */
  emojiColors: Record<string, string>;
  /** 主题 */
  theme: 'light' | 'dark' | 'system';
  /** 主题色 */
  accentColor: string;
  /** 语言 */
  language: 'zh' | 'en';
  /** 是否启用云同步 */
  cloudSyncEnabled: boolean;
  /** 是否启用本地加密 */
  encryptionEnabled: boolean;
  /** 加密盐值 */
  encryptionSalt?: string;
  /** 加密验证器 */
  encryptionVerifier?: string;
  /** 密码提示 */
  encryptionHint?: string;
}

/** 默认设置 */
export const DEFAULT_SETTINGS: UserSettings = {
  weekStart: 1,
  emojis: ['😊', '😐', '😢', '😡', '😴', '🤔', '😎', '🥳'],
  emojiColors: {
    '😊': '#4ade80',
    '😐': '#facc15',
    '😢': '#60a5fa',
    '😡': '#f87171',
    '😴': '#a78bfa',
    '🤔': '#fb923c',
    '😎': '#2dd4bf',
    '🥳': '#f472b6'
  },
  theme: 'system',
  accentColor: '#07c160',
  language: 'zh',
  cloudSyncEnabled: false,
  encryptionEnabled: false
};

// ========== 同步 ==========

/** 同步状态 */
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

/** 同步结果 */
export interface SyncResult {
  /** 本地更新数量 */
  updatedLocal: number;
  /** 远程更新数量 */
  updatedRemote: number;
  /** 冲突数量 */
  conflicts: number;
  /** 同步时间 */
  syncedAt: number;
}

/** 合并差异 */
export interface MergeDiff {
  added: number;
  updated: number;
  deleted: number;
}

// ========== 备份 ==========

/** 备份记录 */
export interface BackupRecord {
  /** 备份ID */
  id: string;
  /** 用户ID */
  userId: string;
  /** 创建时间 */
  createdAt: number;
  /** 备注 */
  note: string;
  /** 摘要 */
  summary: {
    total: number;
    dateRange?: {
      start: string;
      end: string;
    };
  };
  /** 数据大小(字节) */
  size: number;
}

/** 导出格式 */
export type ExportFormat = 'json' | 'csv';

/** 导出数据 */
export interface ExportData {
  version: string;
  exportedAt: number;
  records: MoodRecordMap;
  settings?: Partial<UserSettings>;
}

// ========== API 响应 ==========

/** API 响应基类 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

/** 分页参数 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/** 分页响应 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ========== 统计 ==========

/** 心情统计 */
export interface MoodStats {
  /** 统计周期 */
  period: 'day' | 'week' | 'month' | 'year';
  /** 开始日期 */
  startDate: string;
  /** 结束日期 */
  endDate: string;
  /** 总记录数 */
  total: number;
  /** 各心情分布 */
  distribution: Record<string, number>;
  /** 连续记录天数 */
  streak: number;
  /** 最长连续天数 */
  longestStreak: number;
  /** 趋势数据 */
  trend: Array<{
    date: string;
    mood: string;
    count: number;
  }>;
}

// ========== 平台适配器接口 ==========

/** 存储适配器 */
export interface StorageAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

/** HTTP 客户端适配器 */
export interface HttpAdapter {
  get<T>(url: string, config?: RequestConfig): Promise<T>;
  post<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T>;
  put<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T>;
  delete<T>(url: string, config?: RequestConfig): Promise<T>;
}

/** 请求配置 */
export interface RequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
  params?: Record<string, string | number>;
}
