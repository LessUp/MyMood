/**
 * MoodFlow API 服务入口
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { env } from './config/env';
import { openapi } from './openapi';

import { authRouter } from './routes/auth';
import { syncRouter } from './routes/sync';
import { backupRouter } from './routes/backup';
import { userRouter } from './routes/user';
import { errorHandler } from './middleware/error';

const app = express();
const PORT = env.PORT;

// 中间件
app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// 健康检查
app.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// OpenAPI 规范
app.get('/openapi.json', (_req, res) => {
  res.json(openapi);
});

// API 路由
app.use('/api/auth', authRouter);
app.use('/api/sync', syncRouter);
app.use('/api/backup', backupRouter);
app.use('/api/user', userRouter);

// 错误处理
app.use(errorHandler);

// 连接数据库并启动服务
async function start() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ MongoDB 连接成功');
    
    app.listen(PORT, () => {
      console.log(`🚀 API 服务运行在 http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ 启动失败:', error);
    process.exit(1);
  }
}

start();
