import type { Response } from 'express';
import type { ApiResponse } from '@moodflow/types';
import type { ErrorCode } from './error-codes';

export function ok<T>(res: Response, data: T, status = 200): Response<ApiResponse<T>> {
  return res.status(status).json({ success: true, data });
}

export function fail(res: Response, status: number, code: ErrorCode, message: string): Response<ApiResponse<never>> {
  return res.status(status).json({ success: false, error: { code, message } });
}
