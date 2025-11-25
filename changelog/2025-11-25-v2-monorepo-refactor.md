# v2.0.0 - Monorepo 架构重构

**日期**: 2025-11-25

## 概述

将项目重构为 Monorepo 架构，新增网页版客户端和统一后端 API 服务，支持账号系统和云同步。

## 新增功能

### 多端支持
- **网页版 (apps/web)** - 基于 React + Vite + TailwindCSS 的现代化 Web 应用
- **统一 API (apps/api)** - Node.js + Express + MongoDB 后端服务

### 账号系统
- 邮箱注册/登录
- JWT 认证（Access Token + Refresh Token）
- 微信小程序登录支持
- 用户设置同步

### 云同步
- 跨设备数据同步
- 后写优先冲突解决
- 离线支持，在线时自动同步

### 备份功能
- 云端备份创建
- 备份列表管理
- 备份恢复（合并/覆盖模式）
- JSON 下载导出

## 架构变更

### 目录结构

```
MoodFlow/
├── apps/
│   ├── miniprogram/    # 微信小程序（从根目录迁移）
│   ├── web/            # 新增：网页版
│   └── api/            # 新增：后端 API
├── packages/
│   ├── core/           # 新增：共享业务逻辑
│   └── types/          # 新增：共享类型定义
```

### 共享包

**@moodflow/types**
- MoodEntry, MoodRecordMap
- User, AuthToken
- UserSettings, DEFAULT_SETTINGS
- SyncResult, BackupRecord
- StorageAdapter, HttpAdapter

**@moodflow/core**
- 日期工具函数
- 存储管理器 (StorageManager)
- 同步管理器 (SyncManager)
- 统计计算模块
- 导出/导入模块
- 加密工具模块

### API 端点

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/auth/register | 邮箱注册 |
| POST | /api/auth/login | 邮箱登录 |
| POST | /api/auth/wechat | 微信登录 |
| POST | /api/auth/refresh | 刷新令牌 |
| GET | /api/auth/me | 获取当前用户 |
| GET | /api/sync/records | 获取所有记录 |
| POST | /api/sync/records | 上传/合并记录 |
| PUT | /api/sync/records/:dateKey | 更新单条记录 |
| DELETE | /api/sync/records/:dateKey | 删除单条记录 |
| POST | /api/backup/create | 创建备份 |
| GET | /api/backup/list | 获取备份列表 |
| POST | /api/backup/:id/restore | 恢复备份 |
| GET | /api/backup/:id/download | 下载备份 |

## 技术栈

### 网页版
- React 18
- Vite 5
- TailwindCSS 3
- Zustand (状态管理)
- Recharts (图表)
- Lucide React (图标)
- React Router 6

### API 服务
- Node.js 18+
- Express 4
- MongoDB + Mongoose
- JWT 认证
- Zod 验证
- bcryptjs 加密

### 工具链
- pnpm workspaces
- TypeScript 5
- tsup 打包

## 迁移指南

### 从 v1.x 升级

1. 数据格式兼容，无需迁移
2. 微信小程序路径变更为 `apps/miniprogram`
3. 建议注册账号并开启云同步

### 新用户

1. 克隆仓库
2. `pnpm install`
3. `pnpm dev:web` 启动网页版
4. `pnpm dev:api` 启动 API（需配置 MongoDB）

## 已知限制

- 微信小程序暂未集成新的统一 API（仍使用云开发）
- 网页版不支持本地数据加密（规划中）

## 下一步计划

- 微信小程序集成统一 API
- PWA 支持
- 数据加密
- 更多导出格式（CSV、PDF）
