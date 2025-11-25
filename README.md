# MoodFlow · 心情日历

一个优雅的开源心情记录应用，支持**微信小程序**和**网页版**，用表情快速记录每日心情与备注，支持本地存储与云同步，并内置统计与检索能力。

## ✨ 特性

- **日历视图** - 月份切换、今日快捷键、备注标记
- **心情记录** - 点按选心情、长按编辑备注
- **统计分析** - 趋势折线图、占比环图、连续天数
- **搜索检索** - 关键词、日期范围、表情过滤
- **多端支持** - 微信小程序 + 网页版
- **账号系统** - 邮箱注册登录
- **云同步** - 跨设备数据同步
- **数据备份** - JSON 导出/导入/迁移
- **主题切换** - 浅色/深色/跟随系统
- **多语言** - 中文/English

## 📁 项目结构

```
MoodFlow/
├── apps/
│   ├── miniprogram/    # 微信小程序
│   ├── web/            # 网页版 (React + Vite)
│   └── api/            # 后端 API (Node.js + Express)
├── packages/
│   ├── core/           # 共享业务逻辑
│   └── types/          # 共享类型定义
├── docs/               # 文档
├── tests/              # 测试
└── changelog/          # 变更记录
```

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 8
- MongoDB (API 服务需要)

### 安装依赖

```bash
pnpm install
```

### 开发

```bash
# 启动网页版
pnpm dev:web

# 启动 API 服务
pnpm dev:api

# 微信小程序
# 使用微信开发者工具打开 apps/miniprogram
```

### 构建

```bash
pnpm build
```

## 📱 微信小程序

1. 使用微信开发者工具导入 `apps/miniprogram`
2. 本地预览无需 AppID
3. 云同步需要真实 AppID 并开通云开发

详见 [apps/miniprogram/README.md](apps/miniprogram/README.md)

## 🌐 网页版

基于 React + Vite + TailwindCSS 构建的现代化 Web 应用。

```bash
cd apps/web
pnpm dev
```

访问 http://localhost:5173

## 🔧 API 服务

基于 Node.js + Express + MongoDB 的后端服务。

```bash
cd apps/api
cp .env.example .env
# 编辑 .env 配置数据库连接
pnpm dev
```

### API 端点

- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `GET /api/sync/records` - 获取记录
- `POST /api/sync/records` - 同步记录
- `POST /api/backup/create` - 创建备份
- `GET /api/backup/list` - 备份列表

## ☁️ 云同步

1. 注册账号或登录
2. 设置页开启云同步
3. 数据将自动同步到云端

### 同步规则

- 主键：`dateKey` (YYYY-MM-DD)
- 冲突解决：时间戳较新的优先

## 📦 数据格式

```typescript
interface MoodEntry {
  mood: string;     // 心情表情
  note?: string;    // 备注
  ts: number;       // 时间戳
}

// 存储格式: { "2025-01-15": MoodEntry }
```

## 🔒 隐私与安全

- 数据默认仅存储在本地
- 开启云同步后与云端关联
- 支持本地数据加密
- 无第三方 SDK
- 不申请敏感权限

## 🛣️ 发展路线

详见 [ROADMAP.md](ROADMAP.md)

## 🤝 贡献

欢迎 PR！建议先阅读项目结构和代码风格。

## 📄 许可证

[MIT](LICENSE)

## 📝 变更记录

详见 [changelog/](changelog/) 目录
