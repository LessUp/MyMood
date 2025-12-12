# 方案 B：保留独立 API 的深度优化升级计划（MoodFlow）

**更新时间**：2025-12-12

## 背景与目标

MoodFlow 是一个多端产品（Web / 小程序 / 共享包），并且已经具备独立后端 `apps/api`（登录、云同步、备份等）。

**方案 B** 的核心目标是：

- 保留独立 API（更适配多端与未来扩展）
- 在不破坏现有功能的前提下，逐步提升：
  - 稳定性（异常可控、启动可靠）
  - 安全性（配置强校验、鉴权一致）
  - 性能（减少 DB 往返、批量写入）
  - 可维护性（分层清晰、重复减少）
  - 可测试性（关键逻辑可单测/集成测）

## 总体原则

- **先工程化，再重构业务**：先把配置/错误/边界统一，再做服务化拆分。
- **改动可回滚**：每阶段尽量做可独立验收的增量。
- **契约优先**：API 对客户端是契约，优先保证兼容与清晰。
- **共享包走产物依赖（方案 B）**：`apps/api` 依赖 `@moodflow/*` 的 `dist`，保持工程边界清晰。

---

## Phase 1：工程化基建（已完成）

**目标**：减少散落的配置读取与重复校验，统一错误处理与鉴权策略。

**交付物**：

- 集中 env 校验与读取
  - `apps/api/src/config/env.ts`（Zod 解析/校验）
- JWT 配置集中化
  - `apps/api/src/config/jwt.ts` 统一读取 `env`
- 鉴权中间件安全收敛
  - `apps/api/src/middleware/auth.ts` 使用统一 `JWT_SECRET`，移除弱默认回退
- 全局参数校验错误兜底
  - `apps/api/src/middleware/error.ts` 全局捕获 `ZodError` 统一返回 `400 VALIDATION_ERROR`
- API 入口使用强类型配置
  - `apps/api/src/index.ts` 使用 `env.PORT/env.MONGODB_URI/env.CORS_ORIGIN`

**验收标准**：

- API 在缺少关键配置时能早失败且错误清晰（尤其生产环境 JWT）
- Zod 参数错误不会散落在各路由重复处理

---

## Phase 2：API 结构化升级（推荐下一步优先做）

**目标**：让路由更薄、逻辑集中在 service、数据访问可控；为测试与契约化打基础。

### 2.1 统一响应与错误码

- 交付物
  - `ok(data)` / `fail(code, message, status)` 或等价封装
  - 错误码枚举/常量集中（避免字符串散落）

- 验收标准
  - 路由层不再大量重复 `res.json({success:...})` 模板
  - 错误码统一且可查

### 2.2 业务服务化（按模块拆分）

- Sync（建议第一刀）
  - 把 `bulkWrite` 合并策略下沉到 `services/sync.ts`
  - 路由只负责：校验 -> 调用 service -> 返回

- Backup
  - 备份生成/恢复合并逻辑下沉到 `services/backup.ts`

- User
  - profile/settings/password 下沉到 `services/user.ts`

- 验收标准
  - 路由层不包含复杂业务分支
  - service 层函数可被单测调用

### 2.3 数据访问与索引策略

- 交付物
  - 明确高频查询索引（`userId+dateKey` 唯一、`userId+ts`）
  - 对同步/导入等批量场景优先使用批量 API

---

## Phase 3：类型对齐与客户端契约

**目标**：减少 API 漂移，提高前后端一致性，提升迭代效率。

**推荐路线**：

- 优先 **OpenAPI**（更通用，小程序/第三方客户端也可消费）
  - 可选：Zod -> OpenAPI schema 生成
  - 输出：接口文档 + 客户端类型/SDK（可选）

**验收标准**：

- docs 中有可访问的 API 契约文档
- 关键接口的 request/response 类型可以被客户端复用

---

## Phase 4：质量与发布

**目标**：让 API 的变更可控，避免回归与线上事故。

- 测试
  - 单测：service 层（重点：sync 合并策略、备份恢复策略）
  - 集成测：auth + sync 核心链路

- CI
  - lint + test + build

- 发布
  - 版本策略与变更记录（changelog 继续沿用）

---

## 推荐执行顺序（最小闭环）

1. Phase 2.1：统一响应/错误码
2. Phase 2.2：sync 服务化（先把最复杂的收敛）
3. Phase 4：给 sync/service 加 2-3 条最关键测试
4. Phase 3：再引入 OpenAPI 做契约化

## 备注

- 该计划默认保留现有多端结构（Web + 小程序 + API + shared packages）。
- 每次实施应在 `changelog/` 记录本次变更内容与兼容性说明。
