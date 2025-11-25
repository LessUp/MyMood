/**
 * 加密工具模块 - 平台无关的加密逻辑
 */

/**
 * 加密结果
 */
export interface EncryptResult {
  payload: string;
  iv: string;
}

/**
 * 加密配置
 */
export interface CryptoConfig {
  enabled: boolean;
  salt: string;
  verifier: string;
  hint: string;
}

/**
 * 加密适配器接口 - 由各平台实现
 */
export interface CryptoAdapter {
  /** SHA256 哈希 */
  sha256(input: string): string;
  /** 生成随机盐值 */
  randomSalt(length: number): string;
  /** 派生密钥 */
  deriveKey(password: string, salt: string): string;
  /** AES 加密 */
  encrypt(plaintext: string, key: string): EncryptResult;
  /** AES 解密 */
  decrypt(payload: string, key: string, iv: string): string;
}

/**
 * 加密管理器
 */
export class CryptoManager {
  private adapter: CryptoAdapter;

  constructor(adapter: CryptoAdapter) {
    this.adapter = adapter;
  }

  /**
   * 生成密码验证器
   */
  generateVerifier(password: string, salt: string): string {
    return this.adapter.sha256(password + '|' + salt);
  }

  /**
   * 验证密码
   */
  verifyPassword(password: string, salt: string, verifier: string): boolean {
    return this.generateVerifier(password, salt) === verifier;
  }

  /**
   * 生成新的加密配置
   */
  createConfig(password: string, hint = ''): CryptoConfig {
    const salt = this.adapter.randomSalt(16);
    const verifier = this.generateVerifier(password, salt);
    
    return {
      enabled: true,
      salt,
      verifier,
      hint
    };
  }

  /**
   * 派生加密密钥
   */
  deriveKey(password: string, salt: string): string {
    return this.adapter.deriveKey(password, salt);
  }

  /**
   * 加密数据
   */
  encrypt(data: unknown, key: string): EncryptResult {
    const plaintext = JSON.stringify(data);
    return this.adapter.encrypt(plaintext, key);
  }

  /**
   * 解密数据
   */
  decrypt<T>(payload: string, key: string, iv: string): T {
    const plaintext = this.adapter.decrypt(payload, key, iv);
    return JSON.parse(plaintext) as T;
  }

  /**
   * 加密数据对象（带元数据）
   */
  encryptData(data: unknown, key: string): { __encrypted: true } & EncryptResult {
    const result = this.encrypt(data, key);
    return {
      __encrypted: true,
      ...result
    };
  }

  /**
   * 检查是否为加密数据
   */
  isEncrypted(data: unknown): data is { __encrypted: true; payload: string; iv: string } {
    return (
      typeof data === 'object' &&
      data !== null &&
      '__encrypted' in data &&
      (data as Record<string, unknown>).__encrypted === true
    );
  }
}

/**
 * 创建加密管理器
 */
export function createCryptoManager(adapter: CryptoAdapter): CryptoManager {
  return new CryptoManager(adapter);
}

/**
 * 简单的密码强度检查
 */
export function checkPasswordStrength(password: string): {
  score: number;
  level: 'weak' | 'medium' | 'strong';
  feedback: string[];
} {
  let score = 0;
  const feedback: string[] = [];

  if (password.length >= 8) score++;
  else feedback.push('密码至少需要8个字符');

  if (password.length >= 12) score++;

  if (/[a-z]/.test(password)) score++;
  else feedback.push('建议包含小写字母');

  if (/[A-Z]/.test(password)) score++;
  else feedback.push('建议包含大写字母');

  if (/[0-9]/.test(password)) score++;
  else feedback.push('建议包含数字');

  if (/[^a-zA-Z0-9]/.test(password)) score++;
  else feedback.push('建议包含特殊字符');

  let level: 'weak' | 'medium' | 'strong';
  if (score <= 2) level = 'weak';
  else if (score <= 4) level = 'medium';
  else level = 'strong';

  return { score, level, feedback };
}
