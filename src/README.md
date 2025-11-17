MoodFlow 源码目录说明

项目为微信小程序，平台要求保留根级 `app.*`、`pages/*`、`ec-canvas/*` 等结构。
本目录提供标准化的源码分层映射，便于文档化与跨项目协作。

子目录：
- core：核心业务逻辑（页面与交互的说明与引用）
- utils：工具与辅助函数（映射到根级 `utils/*`）
- api：云同步与备份接口（映射到根级 `utils/cloud.js`、`utils/sync.js`）
- config：配置项（映射到根级 `utils/settings.js`）