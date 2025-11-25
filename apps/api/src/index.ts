/**
 * MoodFlow API 服务入口
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import { authRouter } from './routes/auth';
import { syncRouter } from './routes/sync';
import { backupRouter } from './routes/backup';
import { userRouter } from './routes/user';
import { errorHandler } from './middleware/error';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// 健康检查
app.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
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
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/moodflow';
    await mongoose.connect(mongoUri);
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
