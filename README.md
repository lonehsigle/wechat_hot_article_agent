# 公众号文章采集系统

一个功能完整的微信公众号内容创作与管理平台，支持文章采集、AI改写润色、风格分析、微信发布等全流程。

## 功能特性

- 📥 文章采集 - 支持微信公众号文章批量下载，自动提取正文内容
- ✍ AI改写润色 - 8步SOP流程，多模型协作，质量评分
- 🎨 风格分析 - LLM驱动的文章风格分析，支持风格采集和保存
- 📝 微信发布 - 草稿箱发布，多账号支持，闭环优化
- 🖼 AI配图 - MiniMax文生图API，自动配图
- 🔍 去AI味检测 - 24种模式检测，质量评分，针对性优化

## 技术栈
- **前端**: Next.js 15 + React 19 + TypeScript + Tailwind CSS
- **后端**: Next.js App Router + SQLite + Drizzle ORM
- **AI**: 支持 OpenAI / DeepSeek / MiniMax 等多种 LLM
- **部署**: Docker + Docker Compose

## 快速开始
```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
# 访问
http://localhost:3002
```

## 配置
1. 在设置页面配置 LLM API Key
2. 在账号管理添加微信公众号 AppId 和 AppSecret
3. 开始采集文章并进行 AI 改写

## 许可证
MIT License