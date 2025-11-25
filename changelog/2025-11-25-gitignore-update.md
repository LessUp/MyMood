# Gitignore 更新

**日期**: 2025-11-25

## 变更内容

- 调整根目录 `.gitignore` 以适配 Monorepo 结构
  - 忽略所有包与应用的 `node_modules/`、构建产物 `dist/`、`build/`、`.vite/` 等
  - 忽略测试覆盖率目录 `coverage/`、`.nyc_output/`
  - 忽略环境变量文件 `.env*`（包含 `apps/api/.env*`）
  - 忽略 IDE 配置目录 `.vscode/`、`.idea/` 及临时交换文件 `*.swp`、`*.swo`
  - 忽略系统文件 `.DS_Store`、`Thumbs.db`
  - 忽略日志 `*.log` 及各类包管理器调试日志
  - 忽略小程序相关目录 `miniprogram_npm/`、`apps/miniprogram/miniprogram_npm/`、`unpackage/`
  - 忽略前端构建缓存 `apps/web/.vite/`、`apps/web/.eslintcache`
  - 忽略测试快照目录 `**/__snapshots__/`

## 目的

- 避免将依赖、构建产物、环境变量、IDE/系统文件提交到 Git 仓库
- 统一 Monorepo 下各子应用与包的忽略策略，降低维护成本
