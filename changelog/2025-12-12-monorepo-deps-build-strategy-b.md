# Monorepo 依赖构建策略切换（方案 B）

**日期**: 2025-12-12

## 概述

将 `apps/api` 的 TypeScript 解析策略从“直接引用 workspace 源码（packages/*/src）”切换为“依赖 workspace 构建产物（packages/*/dist）”，使工程边界更清晰、构建链路更接近生产环境。

## 变更内容

### 工程化

- `apps/api/tsconfig.json`
  - 移除 `paths` 指向 `packages/*/src` 的配置。
  - 恢复 `rootDir` 为 `./src`，仅编译 API 工程自身源码。
  - `@moodflow/types` / `@moodflow/core` 的类型解析依赖各自 `dist/*.d.ts`。

- 根目录 `package.json`
  - 新增 `build:deps`：先构建 `@moodflow/types` 与 `@moodflow/core`。
  - `postinstall` 调用 `build:deps`：确保安装依赖后自动生成 `dist`，避免 IDE/tsc 在未构建时出现模块/类型缺失。

## 注意事项

- 若你执行过 `clean` 清空 `packages/*/dist`，请重新运行一次 `npm install` 或手动执行 `npm run build:deps`。
