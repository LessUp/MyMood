# ESLint / typescript-eslint 升级以支持 TypeScript 5.9

**日期**: 2025-12-15

## 概述

为消除 `@typescript-eslint/typescript-estree` 对 TypeScript 版本不受支持的告警，并确保在 TypeScript 5.9 环境下 lint 能稳定运行，对根目录 ESLint 与 `@typescript-eslint/*` 依赖进行升级。

## 变更内容

- 根目录 `package.json`
  - 升级 `eslint` 至 `^8.57.0`（满足 typescript-eslint 的支持范围）。
  - 升级 `@typescript-eslint/parser` 至 `^8.0.0`。
  - 升级 `@typescript-eslint/eslint-plugin` 至 `^8.0.0`。

- `package-lock.json`
  - 随 `npm install` 更新锁文件以落地上述依赖升级。

## 兼容性说明

- 根据 typescript-eslint 官方支持矩阵，TypeScript 支持范围为 `>=4.8.4 <6.0.0`，本仓库当前使用的 TypeScript 5.9 满足该范围。
- ESLint 支持范围为 `^8.57.0 || ^9.0.0`，本次升级选择 `eslint@8` 以降低迁移成本。

## 验证

- `npm run lint`：通过（仅保留 warnings）。
- `npm run test:integration`：通过。
- `npm run build`：通过。
