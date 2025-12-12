# API Phase 2-4 实施记录（结构化升级 / OpenAPI / 测试与 CI）

**日期**: 2025-12-12

## 概述

按 `docs/plan-b-api-evolution.md` 推进方案 B 的 Phase 2-4：完成 API 返回体与错误码统一、核心模块服务化、补齐最小单测与 CI，并提供 OpenAPI 规范输出端点。

## Phase 2：结构化升级

### 2.1 统一响应与错误码

- 新增 `apps/api/src/lib/error-codes.ts`
  - 统一错误码常量 `ErrorCodes`。

- 新增 `apps/api/src/lib/response.ts`
  - `ok(res, data, status)` / `fail(res, status, code, message)` 统一响应输出（匹配 `@moodflow/types` 中的 `ApiResponse<T>`）。

- 调整 `apps/api/src/middleware/auth.ts`
  - 使用 `fail + ErrorCodes` 输出鉴权错误。

- 调整 `apps/api/src/middleware/error.ts`
  - `ZodError` 统一返回 `VALIDATION_ERROR`。
  - 将常见业务错误（`EMAIL_EXISTS`、`INVALID_CREDENTIALS`、`INVALID_REFRESH_TOKEN`、`WECHAT_*` 等）映射为统一错误码与 HTTP 状态。

### 2.2 模块服务化（routes 变薄）

- 新增 `apps/api/src/services/sync.ts`
  - `mergeRecords` 使用 `bulkWrite` 批量写入，减少数据库往返。
  - `getAllRecords / upsertRecord / deleteRecord / deleteAllRecords / getSyncStatus` 等接口收敛。

- 调整 `apps/api/src/routes/sync.ts`
  - 路由层只负责参数校验与调用 service。

- 新增 `apps/api/src/services/backup.ts`、`apps/api/src/services/user.ts`
  - 将备份与用户相关业务逻辑下沉到 service。

- 调整 `apps/api/src/routes/backup.ts`、`apps/api/src/routes/user.ts`
  - 路由层改为调用 service，并统一使用 `ok/fail`。

- 调整 `apps/api/src/routes/auth.ts`
  - 全部接口统一使用 `ok` 返回，参数校验交由全局 `ZodError` 处理。

## Phase 3：OpenAPI 契约输出

- 新增 `apps/api/src/openapi.ts`
  - 提供最小 OpenAPI 文档骨架（后续可持续丰富 schema）。

- 调整 `apps/api/src/index.ts`
  - 新增 `GET /openapi.json` 返回 OpenAPI 规范。

## Phase 4：测试与 CI

- 新增 `apps/api/vitest.config.ts`
- 新增 `apps/api/src/__tests__/sync.service.test.ts`
  - 覆盖 `services/sync` 的关键路径（bulkWrite、upsert 删除分支、状态查询、清空记录）。

- 新增 GitHub Actions 工作流：`.github/workflows/ci.yml`
  - `npm ci` -> `npm run build:deps` -> `npm run lint` -> `npm run test` -> `npm run build`

## 兼容性说明

- 本次改动以结构化与工程化为主，API 路由路径与主要返回结构保持兼容。
- `/openapi.json` 为新增端点。
