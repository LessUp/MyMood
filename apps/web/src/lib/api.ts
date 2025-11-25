/**
 * API 客户端封装
 */

import type { ApiResponse } from '@moodflow/types';

const API_BASE = '/api';

class ApiError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
}

function getAuthHeaders(): Record<string, string> {
  try {
    const stored = localStorage.getItem('moodflow-auth');
    if (stored) {
      const { state } = JSON.parse(stored);
      if (state?.tokens?.accessToken) {
        return { Authorization: `Bearer ${state.tokens.accessToken}` };
      }
    }
  } catch {
    // ignore
  }
  return {};
}

async function request<T>(
  method: string,
  path: string,
  data?: unknown,
  options: RequestOptions = {}
): Promise<T> {
  const url = `${API_BASE}${path}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...options.headers
  };

  const config: RequestInit = {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || 30000);
  config.signal = controller.signal;

  try {
    const res = await fetch(url, config);
    clearTimeout(timeoutId);

    const json: ApiResponse<T> = await res.json();

    if (!json.success) {
      throw new ApiError(
        json.error?.message || '请求失败',
        json.error?.code || 'UNKNOWN_ERROR',
        res.status
      );
    }

    return json.data as T;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof ApiError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError('请求超时', 'TIMEOUT', 408);
    }
    throw new ApiError('网络错误', 'NETWORK_ERROR', 0);
  }
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => 
    request<T>('GET', path, undefined, options),
  
  post: <T>(path: string, data?: unknown, options?: RequestOptions) => 
    request<T>('POST', path, data, options),
  
  put: <T>(path: string, data?: unknown, options?: RequestOptions) => 
    request<T>('PUT', path, data, options),
  
  delete: <T>(path: string, options?: RequestOptions) => 
    request<T>('DELETE', path, undefined, options)
};

export { ApiError };
