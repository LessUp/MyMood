# API Phase 1 - 工程化基建

**日期**: 2025-12-12

## 概述

在保留独立 API（方案 B）的前提下，为 `apps/api` 落地第一阶段工程化基建：集中配置与环境变量校验、统一 JWT 密钥读取、统一参数校验错误处理，提升安全性与可维护性。

## 变更内容

### 配置与环境变量

- 新增 `apps/api/src/config/env.ts`
  - 使用 Zod 对 `PORT`、`MONGODB_URI`、`CORS_ORIGIN`、JWT 相关配置进行集中解析。
  - 生产环境下强制要求配置 `JWT_SECRET` 与 `JWT_REFRESH_SECRET`。

- 调整 `apps/api/src/index.ts`
  - 使用 `env.PORT`、`env.MONGODB_URI`、`env.CORS_ORIGIN`，减少散落的 `process.env` 访问与默认值漂移。

### JWT 与鉴权

- 调整 `apps/api/src/config/jwt.ts`
  - 改为从 `env` 读取 JWT 配置。

- 调整 `apps/api/src/middleware/auth.ts`
  - 统一使用 `JWT_SECRET`，移除弱默认值回退。

### 错误处理

- 调整 `apps/api/src/middleware/error.ts`
  - 增加对 `ZodError` 的全局兜底处理，统一返回 `400 VALIDATION_ERROR`。

## 兼容性说明

- 生产环境必须提供 `.env` 中的 `JWT_SECRET` 与 `JWT_REFRESH_SECRET`。
