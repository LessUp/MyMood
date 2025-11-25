# MoodFlow 微信小程序

微信小程序客户端。

## 开发

1. 使用"微信开发者工具"导入 `apps/miniprogram` 目录
2. 本地预览无需 AppID
3. 若需云同步，使用真实 AppID 并开通云开发

## 云同步配置

1. 开通云环境，复制环境 ID
2. 部署云函数：右键 `cloudfunctions/login` → "上传并部署"
3. 设置页开启云同步并填写环境 ID

## 目录结构

```
├── pages/          # 页面
│   ├── calendar/   # 日历
│   ├── detail/     # 详情
│   ├── stats/      # 统计
│   ├── settings/   # 设置
│   ├── search/     # 搜索
│   └── privacy/    # 隐私
├── utils/          # 工具函数
├── cloudfunctions/ # 云函数
├── ec-canvas/      # ECharts 组件
└── assets/         # 静态资源
```
