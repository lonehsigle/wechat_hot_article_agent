# 公众号文章采集系统

一个功能完整的微信公众号内容创作与管理平台，支持文章采集、AI改写润色、风格分析、微信发布等全流程。

## 功能特性

### 核心功能
- 📥 **文章采集** - 支持微信公众号文章批量下载，自动提取正文内容
- ✍ **AI改写润色** - 8步SOP流程，多模型协作，质量评分
- 🎨 **风格分析** - LLM驱动的文章风格分析，支持风格采集和保存
- 📝 **微信发布** - 草稿箱发布，多账号支持，闭环优化
- 🖼 **AI配图** - MiniMax文生图API，自动配图
- 🔍 **去AI味检测** - 24种模式检测，质量评分，针对性优化

### 新增功能
- 🔥 **热门选题** - 多源搜索热门话题，支持 Tavily/天工/MiniMax/维基百科/Bing/DuckDuckGo/百度/Google
- 📡 **热雷达** - 实时热点监控，网络搜索聚合
- 🎯 **SEO优化** - 文章SEO分析与优化建议
- 🔄 **闭环优化** - 基于账号定位的智能内容优化

## 技术栈
- **前端**: Next.js 15 + React 19 + TypeScript + Tailwind CSS
- **后端**: Next.js App Router + PostgreSQL + Drizzle ORM
- **AI**: 支持 OpenAI / DeepSeek / MiniMax 等多种 LLM
- **搜索**: Tavily / 天工 / MiniMax / 维基百科 / Bing / DuckDuckGo / 百度 / Google
- **部署**: Docker + Docker Compose

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 访问
http://localhost:3003
```

## 环境变量配置

创建 `.env.local` 文件并配置以下变量：

```bash
# 微信公众号 API 配置
WECHAT_APPID=your_wechat_appid
WECHAT_SECRET=your_wechat_secret
WECHAT_AUTHOR=默认作者名称

# 图片源 API Keys（部分功能免费）
UNSPLASH_ACCESS_KEY=your_unsplash_access_key
PEXELS_API_KEY=your_pexels_api_key

# 搜索服务 API Keys
EXA_API_KEY=your_exa_api_key
TAVILY_API_KEY=your_tavily_api_key
TIANGONG_API_KEY=your_tiangong_api_key
MINIMAX_API_KEY=your_minimax_api_key
MINIMAX_GROUP_ID=your_minimax_group_id
```

## 功能说明

### 热门选题搜索
支持多搜索引擎聚合搜索，优先级顺序：
1. Tavily（需 API Key）
2. 天工（需 API Key）
3. MiniMax（需 API Key）
4. 维基百科（免费）
5. Bing（免费）
6. DuckDuckGo（免费）
7. 百度（免费）
8. Google（免费）

### 公众号管理
- 支持多公众号账号管理
- 配置目标用户群体和读者画像
- 闭环优化时自动使用账号定位信息

### AI改写流程
1. 原文分析
2. 风格提取
3. 大纲生成
4. 内容改写
5. 风格润色
6. 质量评分
7. 去AI味检测
8. 最终优化

## 许可证

MIT License
