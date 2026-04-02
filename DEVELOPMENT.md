# 公众号文章采集系统 - 完整开发文档

**当前版本: 1.17.2**

**版本更新日志: [CHANGELOG.md](./CHANGELOG.md)**

***

## 一、项目概述

### 1.1 项目简介

本项目是一个功能完整的微信公众号文章采集和管理系统，基于 Next.js 15 开发。系统支持公众号登录、文章搜索、文章下载、多格式导出、内容分析、AI 写作辅助等功能。项目采用前后端一体化架构，使用 SQLite 作为本地数据库，支持 Docker 容器化部署。

### 1.2 核心功能模块

1. **微信公众号采集** - 二维码登录、Cookie 登录、公众号搜索、文章列表获取、批量下载
2. **文章管理** - 文章库管理、多格式导出（HTML/Markdown/Text/JSON/Excel/Word）
3. **订阅监控** - 公众号订阅、定时抓取、自动监控
4. **内容分析** - 词云生成、热点分析、情感分析、发布时间分布
5. **AI 写作辅助** - 标题生成、内容改写、写作技巧库
6. **创作工作台** - 完整SOP流程实现（7步流程）
7. **公开 API** - RESTful API 接口供外部程序调用
8. **代理支持** - 私有代理节点配置

### 1.3 创作工作台SOP流程

创作工作台完整实现了SOP流程，包含以下8个步骤：

| 步骤 | 名称 | 功能说明 |
|------|------|----------|
| Step 1 | 选择文章与风格 | 选择要改写的文章，选择写作风格 |
| Step 2 | 生成标题 | 三模型生成标题 + **保留过万阅读量原标题置于首位** + 评分排序 |
| Step 3 | 拆解原文 | 提取核心观点、识别结构框架、提取关键论据和案例 |
| Step 4 | 组装创作 | 开头公式（身份+痛点+确定结果）+ 正文模板 + 结尾写法 |
| Step 5 | AI检测 | 24种模式检测 + 质量评分（满分50分） |
| Step 6 | 润色优化 | 根据AI检测结果进行润色优化 |
| Step 7 | 生成配图 | **MiniMax AI 文生图** + 逐次上传 |
| Step 8 | 发布草稿 | 转换发布草稿（90分门槛） |

**重要特性：**
- **过万阅读量标题保留**：如果原文阅读量≥10000，原标题会自动置于第一选择位，并标注"🔥X.X万阅读"
- **原文内容传递**：开头、正文、结尾创作时都会传递原文内容，确保改写不偏离原文主题
- **AI 配图生成**：使用 MiniMax 文生图 API（image-01 模型），根据文章内容自动生成配图
- **拆解框架应用**：原文拆解后的框架会应用于后续创作

**核心服务模块：**
- `/lib/ai-detection/service.ts` - AI去味检测服务（24种模式+质量评分）
- `/lib/prompts.ts` - 创作提示词模板（包含原文内容占位符）

### 1.4 技术栈

| 类别          | 技术                                   |
| ----------- | ------------------------------------ |
| 前端框架        | Next.js 15 (App Router), React 19    |
| 后端框架        | Next.js API Routes                   |
| 数据库         | SQLite (better-sqlite3), Drizzle ORM |
| UI 方案       | 内联样式 (无UI框架)                         |
| LLM 服务      | MiniMax M2.5-highspeed API           |
| 中文分词        | segmentit                            |
| HTML 解析     | cheerio                              |
| Markdown 转换 | turndown, marked                     |
| 文档生成        | docx (Word), xlsx (Excel)            |
| 浏览器自动化      | playwright                           |

***

## 二、项目结构

```
content-monitor/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/                      # API 路由目录
│   │   │   ├── wechat/               # 微信公众号核心 API
│   │   │   ├── wechat-collect/       # 微信文章采集 API
│   │   │   ├── wechat-accounts/      # 微信账号管理 API
│   │   │   ├── wechat-drafts/        # 微信草稿箱 API
│   │   │   ├── wechat-config/        # 微信配置 API
│   │   │   ├── article-download/     # 文章下载 API
│   │   │   ├── article-export/       # 文章导出 API
│   │   │   ├── album/                # 合集下载 API
│   │   │   ├── comment/              # 评论获取 API
│   │   │   ├── v1/                   # 公开 API v1
│   │   │   │   ├── route.ts          # API 文档
│   │   │   │   ├── authkey/          # 认证验证
│   │   │   │   ├── account/          # 公众号搜索
│   │   │   │   ├── article/          # 文章列表
│   │   │   │   └── download/         # 文章下载
│   │   │   ├── subscriptions/        # 订阅管理 API
│   │   │   ├── proxy-config/         # 代理配置 API
│   │   │   ├── app-settings/         # 应用设置 API
│   │   │   ├── analysis/             # 内容分析 API
│   │   │   ├── generate/             # AI 生成 API
│   │   │   ├── rewrite/              # 文章改写 API
│   │   │   ├── hot-topics/           # 热点话题 API
│   │   │   ├── llm-config/           # LLM 配置 API
│   │   │   ├── materials/            # 素材库 API
│   │   │   ├── styles/               # 写作风格 API
│   │   │   ├── writing-techniques/   # 写作技巧 API
│   │   │   ├── benchmark/            # 标杆账号 API
│   │   │   ├── publish/              # 发布管理 API
│   │   │   ├── published-articles/   # 已发布文章 API
│   │   │   ├── crawler/              # 爬虫任务 API
│   │   │   ├── monitor/              # 监控任务 API
│   │   │   ├── segment/              # 分词服务 API
│   │   │   ├── cache/                # 缓存管理 API
│   │   │   ├── categories/           # 分类管理 API
│   │   │   ├── analytics/            # 数据分析 API
│   │   │   ├── evaluate/             # 评估服务 API
│   │   │   ├── image-generation/     # 图片生成 API
│   │   │   ├── topic-analysis/       # 话题分析 API
│   │   │   ├── deep-fetch/           # 深度抓取 API
│   │   │   ├── monitor-config/       # 监控配置 API
│   │   │   └── create-workshop/      # 创作工坊 API
│   │   ├── components/               # React 组件
│   │   │   ├── CreateWorkbench.tsx   # 创作工作台组件
│   │   │   ├── MarkdownEditor.tsx    # Markdown 编辑器
│   │   │   └── PromptManager.tsx     # Prompt 管理器
│   │   ├── globals.css               # 全局样式
│   │   ├── layout.tsx                # 根布局
│   │   └── page.tsx                  # 主页面 (所有功能集成)
│   ├── lib/                          # 核心库
│   │   ├── db/                       # 数据库层
│   │   │   ├── index.ts              # 数据库连接
│   │   │   ├── schema.ts             # 数据库 Schema 定义
│   │   │   └── queries.ts            # 查询函数
│   │   ├── llm/                      # LLM 服务
│   │   │   └── service.ts            # MiniMax API 调用
│   │   ├── wechat/                   # 微信相关工具
│   │   │   ├── service.ts            # 微信 API 服务
│   │   │   ├── cookie-store.ts       # Cookie 管理
│   │   │   ├── proxy-request.ts      # 代理请求封装
│   │   │   ├── proxy-config.ts       # 代理配置管理
│   │   │   ├── article-parser.ts     # 文章解析器
│   │   │   └── wxdown-service.ts     # wxdown 服务集成
│   │   ├── crawler/                  # 爬虫服务
│   │   │   └── service.ts            # 多平台爬虫
│   │   ├── evaluation/               # 评估服务
│   │   │   └── service.ts            # 内容评估
│   │   ├── image/                    # 图片服务
│   │   │   └── service.ts            # 图片处理
│   │   ├── utils/                    # 工具函数
│   │   │   └── html-markdown.ts      # HTML/Markdown 转换
│   │   ├── prompts.ts                # 共享 Prompt 模块
│   │   └── wechat-auth.ts            # 微信认证工具
│   └── types/                        # TypeScript 类型声明
│       ├── index.ts                  # 全局类型
│       └── segmentit.d.ts            # segmentit 类型
├── drizzle.config.ts                 # Drizzle ORM 配置
├── Dockerfile                        # Docker 构建文件
├── docker-compose.yml                # Docker Compose 配置
├── .dockerignore                     # Docker 忽略文件
├── next.config.js                    # Next.js 配置
├── package.json                      # 项目依赖
└── DEVELOPMENT.md                    # 本文档
```

***

## 三、数据库设计

### 3.1 数据库表概览

| 表名                    | 说明        | 主要字段                                           |
| --------------------- | --------- | ---------------------------------------------- |
| wechat\_sessions      | 微信登录会话    | auth\_key, token, cookies, nickname            |
| wechat\_subscriptions | 公众号订阅     | biz, name, monitor\_enabled, monitor\_interval |
| collected\_articles   | 采集的文章     | title, content, source\_url, read\_count       |
| app\_settings         | 应用配置      | key, value, updatedAt                          |
| wechat\_drafts        | 微信草稿箱     | media\_id, title, content, status              |
| wechat\_accounts      | 微信账号配置    | name, app\_id, app\_secret                     |
| wechat\_auth          | 微信认证信息    | token, cookie, status                          |
| collect\_tasks        | 采集任务      | subscription\_id, status, total\_articles      |
| published\_articles   | 已发布文章     | title, content, publish\_status                |
| article\_stats        | 文章统计      | article\_id, read\_count, like\_count          |
| llm\_configs          | LLM 配置    | provider, api\_key, model                      |
| prompt\_configs       | Prompt 配置 | key, name, template                            |
| writing\_styles       | 写作风格      | name, title\_strategy, opening\_style          |
| writing\_techniques   | 写作技巧      | category, stage, title, content                |
| material\_library     | 素材库       | type, title, content, tags                     |
| benchmark\_accounts   | 标杆账号      | platform, account\_id, account\_name           |
| viral\_titles         | 爆款标题      | title, read\_count, analysis                   |
| hot\_topics           | 热点话题      | platform, title, hot\_value                    |
| analysis\_tasks       | 分析任务      | keyword, status, total\_articles               |
| insight\_reports      | 洞察报告      | task\_id, insights, word\_cloud                |
| generated\_articles   | 生成的文章     | task\_id, title, content                       |
| article\_rewrites     | 文章改写      | title, content, style                          |
| platform\_posts       | 平台帖子      | platform, post\_id, content                    |
| post\_comments        | 帖子评论      | post\_id, content, sentiment                   |
| creators              | 创作者       | platform, creator\_id, name                    |
| crawl\_tasks          | 爬虫任务      | platform, type, status                         |
| word\_cloud\_cache    | 词云缓存      | cache\_key, basic\_word\_cloud                 |
| cache\_records        | 缓存记录      | cache\_key, cache\_data                        |
| monitor\_categories   | 监控分类      | name, platforms, keywords                      |
| monitor\_logs         | 监控日志      | type, message, data                            |

### 3.2 核心表详细设计

#### 3.2.1 wechat\_sessions (微信会话表)

```typescript
{
  id: integer;           // 主键
  authKey: string;       // 认证密钥 (唯一)
  token: string;         // 微信 token
  cookies: string;       // Cookie 字符串
  nickname: string;      // 用户昵称
  avatar: string;        // 用户头像
  status: string;        // 状态: active/expired
  expiresAt: Date;       // 过期时间
  createdAt: Date;       // 创建时间
  updatedAt: Date;       // 更新时间
}
```

#### 3.2.2 wechat\_subscriptions (公众号订阅表)

```typescript
{
  id: integer;              // 主键
  biz: string;              // 公众号唯一标识 (唯一)
  name: string;             // 公众号名称
  alias: string;            // 公众号别名
  avatar: string;           // 头像 URL
  description: string;      // 描述
  lastArticleTime: Date;    // 最后文章时间
  totalArticles: number;    // 总文章数
  monitorEnabled: boolean;  // 是否启用监控
  monitorInterval: number;  // 监控间隔(秒)，默认 300
  lastMonitorAt: Date;      // 最后监控时间
  status: string;           // 状态: active/paused
  createdAt: Date;
  updatedAt: Date;
}
```

#### 3.2.3 collected\_articles (采集文章表)

```typescript
{
  id: integer;              // 主键
  subscriptionId: number;   // 关联订阅 ID
  msgId: string;            // 文章消息 ID (唯一)
  title: string;            // 文章标题
  author: string;           // 作者
  digest: string;           // 摘要
  content: string;          // Markdown 内容
  contentHtml: string;      // HTML 内容
  coverImage: string;       // 封面图
  localImages: string[];    // 本地图片路径
  sourceUrl: string;        // 原文链接
  publishTime: Date;        // 发布时间
  readCount: number;        // 阅读数
  likeCount: number;        // 点赞数
  commentCount: number;     // 评论数
  recommendCount: number;   // 推荐数
  shareCount: number;       // 分享数
  engagementRate: number;   // 互动率
  isDeleted: boolean;       // 是否已删除
  deletedAt: Date;          // 删除时间
  snapshotPath: string;     // 快照路径
  markdownPath: string;     // Markdown 文件路径
  pdfPath: string;          // PDF 文件路径
  tags: string[];           // 标签
  note: string;             // 备注
  isFavorite: boolean;      // 是否收藏
  createdAt: Date;
  updatedAt: Date;
}
```

#### 3.2.4 app\_settings (应用配置表) \[v1.1.0 新增]

```typescript
{
  id: integer;              // 主键
  key: string;              // 配置键 (唯一)
  value: string;            // 配置值 (JSON 格式)
  updatedAt: Date;          // 更新时间
}
```

**预定义配置键:**

- `menuSettings` - 侧栏菜单显示设置
- `llmConfig` - LLM 服务配置
- `proxyConfig` - 代理配置

***

## 四、API 接口文档

### 4.1 微信公众号 API (`/api/wechat`)

| Action    | 方法  | 说明      | 参数                         |
| --------- | --- | ------- | -------------------------- |
| getqrcode | GET | 获取登录二维码 | -                          |
| scan      | GET | 检查扫码状态  | uuid                       |
| login     | GET | 检查登录状态  | -                          |
| search    | GET | 搜索公众号   | query, begin, count        |
| articles  | GET | 获取文章列表  | fakeid, type, begin, count |
| info      | GET | 获取公众号信息 | fakeid                     |
| status    | GET | 获取登录状态  | -                          |
| logout    | GET | 退出登录    | -                          |

### 4.2 文章下载 API (`/api/article-download`)

| Action   | 方法   | 说明     | 参数                              |
| -------- | ---- | ------ | ------------------------------- |
| download | GET  | 下载单篇文章 | url, format (html/md/text/json) |
| batch    | POST | 批量下载文章 | urls\[], format                 |

### 4.3 文章导出 API (`/api/article-export`)

| Action | 方法       | 说明   | 参数                                |
| ------ | -------- | ---- | --------------------------------- |
| export | GET/POST | 导出文章 | articleIds\[], format (xlsx/docx) |

### 4.4 合集 API (`/api/album`)

| Action | 方法  | 说明        | 参数     |
| ------ | --- | --------- | ------ |
| get    | GET | 获取合集信息    | url    |
| list   | GET | 获取公众号合集列表 | fakeid |

### 4.5 评论 API (`/api/comment`)

| Action | 方法       | 说明                      | 参数  |
| ------ | -------- | ----------------------- | --- |
| get    | GET      | 获取文章评论                  | url |
| config | GET/POST | 获取/设置 wxdown-service 配置 | -   |

### 4.6 公开 API v1 (`/api/v1`) \[v1.1.0 新增]

用于外部程序调用的 RESTful API 接口，所有接口需要 `auth_key` 参数。

#### 4.6.1 认证验证 (`/api/v1/authkey`)

- **GET**: 验证 auth\_key 有效性
- 参数: `auth_key`
- 返回: 会话信息 (nickname, avatar, status)

#### 4.6.2 公众号搜索 (`/api/v1/account`)

- **GET**: 搜索公众号
- 参数: `auth_key`, `query` (搜索关键词), `count` (返回数量)
- 返回: 公众号列表 (fakeid, nickname, alias, round\_head\_img)

#### 4.6.3 文章列表 (`/api/v1/article`)

- **GET**: 获取公众号文章列表
- 参数: `auth_key`, `fakeid` (公众号ID), `begin` (起始位置), `count` (数量)
- 返回: 文章列表 (aid, title, link, cover, create\_time)

#### 4.6.4 文章下载 (`/api/v1/download`)

- **GET**: 下载文章内容
- 参数: `auth_key`, `url` (文章链接), `format` (html/md/text/json)
- 返回: 文章内容

### 4.7 代理配置 API (`/api/proxy-config`) \[v1.1.0 新增]

| 方法   | 说明       | 参数                                            |
| ---- | -------- | --------------------------------------------- |
| GET  | 获取当前代理配置 | -                                             |
| POST | 更新代理配置   | enabled, type, host, port, username, password |

代理配置结构:

```typescript
interface ProxyConfig {
  enabled: boolean;
  type: 'http' | 'https' | 'socks5';
  host: string;
  port: number;
  username?: string;
  password?: string;
}
```

### 4.8 订阅管理 API (`/api/subscriptions`) \[v1.1.0 新增]

| Action | 方法   | 说明          | 参数                                                 |
| ------ | ---- | ----------- | -------------------------------------------------- |
| list   | GET  | 获取订阅列表      | -                                                  |
| add    | POST | 添加订阅        | biz, name, avatar, monitorEnabled, monitorInterval |
| update | POST | 更新订阅设置      | id, monitorEnabled, monitorInterval                |
| delete | GET  | 删除订阅        | id                                                 |
| fetch  | GET  | 获取订阅新文章     | auth\_key, biz, count                              |
| run    | GET  | 运行所有启用的订阅监控 | auth\_key                                          |

### 4.9 应用设置 API (`/api/app-settings`) \[v1.1.0 新增]

| 方法     | 说明   | 参数                 |
| ------ | ---- | ------------------ |
| GET    | 获取设置 | key (可选，不传则返回所有设置) |
| POST   | 保存设置 | key, value         |
| DELETE | 删除设置 | key                |

### 4.10 其他 API 概览

| API 路径                    | 说明       |
| ------------------------- | -------- |
| `/api/analysis`           | 内容分析服务   |
| `/api/generate`           | AI 内容生成  |
| `/api/rewrite`            | 文章改写服务   |
| `/api/hot-topics`         | 热点话题获取   |
| `/api/llm-config`         | LLM 配置管理 |
| `/api/materials`          | 素材库管理    |
| `/api/styles`             | 写作风格管理   |
| `/api/writing-techniques` | 写作技巧管理   |
| `/api/benchmark`          | 标杆账号管理   |
| `/api/publish`            | 发布管理     |
| `/api/crawler`            | 爬虫任务管理   |
| `/api/monitor`            | 监控任务管理   |
| `/api/segment`            | 中文分词服务   |
| `/api/cache`              | 缓存管理     |
| `/api/analytics`          | 数据分析     |

***

## 五、核心模块说明

### 5.1 微信公众号采集模块

#### 5.1.1 登录流程

1. 调用 `/api/wechat?action=getqrcode` 获取二维码
2. 前端展示二维码，用户扫码
3. 轮询 `/api/wechat?action=scan&uuid=xxx` 检查扫码状态
4. 扫码成功后调用 `/api/wechat?action=login` 完成登录
5. 保存 token 和 cookies 到数据库

#### 5.1.2 文章采集流程

1. 调用 `/api/wechat?action=search&query=xxx` 搜索公众号
2. 选择公众号后调用 `/api/wechat?action=articles&fakeid=xxx` 获取文章列表
3. 选择文章后调用 `/api/article-download?action=download&url=xxx` 下载文章
4. 文章保存到 `collected_articles` 表

#### 5.1.3 频率限制

- 短时间内获取超过 600 条文章数据会触发 `200013 freq control` 限制
- 限制会导致 24 小时内无法调用接口
- 建议批量采集时添加延迟

### 5.2 订阅监控模块 \[v1.1.0 新增]

#### 5.2.1 功能说明

- 支持订阅多个公众号
- 每个订阅可配置监控间隔（默认 300 秒）
- 支持启用/暂停监控
- 支持一键运行所有启用的订阅监控

#### 5.2.2 监控流程

1. 调用 `/api/subscriptions?action=run&auth_key=xxx`
2. 系统遍历所有启用的订阅
3. 检查是否到达监控间隔
4. 调用微信 API 获取最新文章
5. 新文章保存到数据库

### 5.3 LLM 服务模块

#### 5.3.1 MiniMax API 调用

```typescript
// MiniMax API 不支持 system role
// 所有 system prompt 需要合并到 user prompt 中
const messages = [
  { role: 'user', content: systemPrompt + '\n\n' + userPrompt },
];
```

#### 5.3.2 共享 Prompt 模块

所有 LLM 调用的 prompt 统一管理在 `/lib/prompts.ts` 中：

- `WORD_CLOUD_PROMPT` - 词云分析
- `TITLE_GENERATION_PROMPT` - 标题生成
- `CONTENT_REWRITE_PROMPT` - 内容改写
- `SENTIMENT_ANALYSIS_PROMPT` - 情感分析

### 5.4 中文分词模块

使用 `segmentit` 库进行中文分词：

```typescript
import { Segment, useDefault } from 'segmentit';
const segment = new Segment();
useDefault(segment);

const words = segment.doSegment(text, { simple: true });
```

### 5.5 wxdown-service 集成

wxdown-service 是独立的 Python 服务，用于获取文章阅读数等数据：

- WebSocket 地址: `ws://127.0.0.1:65001`
- 代理地址: `http://127.0.0.1:65000`

***

## 六、部署说明

### 6.1 本地开发

```bash
# 安装依赖
npm install

# 初始化数据库
npm run db:generate
npm run db:migrate

# 启动开发服务器
npm run dev
```

### 6.2 Docker 部署 \[v1.1.0 新增]

#### 构建镜像

```bash
docker build -t content-monitor .
```

#### 使用 Docker Compose

```bash
docker-compose up -d
```

#### 环境变量

| 变量名            | 说明      | 默认值                          |
| -------------- | ------- | ---------------------------- |
| DATABASE\_PATH | 数据库文件路径 | /app/data/content-monitor.db |
| NODE\_ENV      | 运行环境    | production                   |

#### 数据持久化

Docker Compose 配置中已设置数据卷挂载，数据库文件将持久化到 `./data` 目录。

### 6.3 生产环境配置

1. 配置 `next.config.js`:

```javascript
module.exports = {
  output: 'standalone',
  // 其他配置...
}
```

1. 构建生产版本:

```bash
npm run build
```

1. 启动生产服务器:

```bash
npm run start
```

***

## 七、开发注意事项

### 7.1 代码规范

- 一个函数只做一件事
- 返回响应式数据
- 注意依赖收集
- 使用有范围的样式（避免全局样式）
- 显示用户友好的错误信息
- 增加用于调试目的的日志错误

### 7.2 安全措施

- 不删除生产数据或配置文件
- 不泄露敏感信息（API 密钥、密码、令牌）
- 不执行不可逆的系统命令
- 所有 API 调用需要验证 auth\_key

### 7.3 性能优化

- 使用 SQLite 索引优化查询
- 缓存词云分析结果
- 批量操作时添加延迟避免频率限制

***

## 八、功能实现进度

### 8.1 已完成功能

| 功能                       | 版本     | 相关文件                               | 状态 |
| ------------------------ | ------ | ---------------------------------- | -- |
| GitHub公开库安全检查         | v1.17.2 | `.gitignore`                        | ✅  |
| 润色优化逻辑改进 | v1.17.1 | `/api/create-workshop/route.ts`, `/lib/ai-detection/service.ts` | ✅ |
| 风格分析使用大模型               | v1.16.1 | `/api/style-analysis/route.ts`      | ✅  |
| 文章风格采集功能               | v1.16.0 | `/api/style-analysis/route.ts`      | ✅  |
| 排版风格升级为AIWriteX风格        | v1.15.3 | `/lib/wechat/service.ts`            | ✅  |
| 配图和排版风格应用修复           | v1.15.2 | `/api/publish/route.ts`             | ✅  |
| 微信公众号草稿摘要长度限制修复      | v1.15.1 | `/api/publish/route.ts`             | ✅  |
| 多选文章批量改写发布             | v1.15.0 | `/components/CreateWorkbench.tsx`   | ✅  |
| 润色优化系统重构               | v1.14.0 | `/lib/prompts.ts`                   | ✅  |
| 闭环优化系统                 | v1.13.0 | `/api/optimization-loop/route.ts`   | ✅  |
| 图片生成改用MiniMax AI          | v1.6.0  | `/lib/image/service.ts`             | ✅  |
| 公众号采集独立菜单                | v1.2.0 | `/app/page.tsx`                    | ✅  |
| 发布时间分布柱形图                | v1.1.0 | `/app/page.tsx`                    | ✅  |
| 菜单设置持久化                  | v1.1.0 | `/api/app-settings/route.ts`       | ✅  |
| 订阅管理前端 UI                | v1.1.0 | `/app/page.tsx`                    | ✅  |
| 订阅公众号定时抓取 API            | v1.1.0 | `/api/subscriptions/route.ts`      | ✅  |
| 私有代理节点配置                 | v1.1.0 | `/lib/wechat/proxy-config.ts`      | ✅  |
| Docker 部署支持              | v1.1.0 | `Dockerfile`, `docker-compose.yml` | ✅  |
| 公开 API 调用接口              | v1.1.0 | `/api/v1/*`                        | ✅  |
| 批量下载文章过滤                 | v1.1.0 | `/app/page.tsx`                    | ✅  |
| wxdown-service 集成        | v1.0.0 | `/lib/wechat/wxdown-service.ts`    | ✅  |
| 评论获取框架                   | v1.0.0 | `/api/comment/route.ts`            | ✅  |
| 合集下载                     | v1.0.0 | `/api/album/route.ts`              | ✅  |
| 文章导出 (Excel/Word)        | v1.0.0 | `/api/article-export/route.ts`     | ✅  |
| 文章下载 (HTML/MD/Text/JSON) | v1.0.0 | `/api/article-download/route.ts`   | ✅  |
| 文章列表获取                   | v1.0.0 | `/api/wechat/route.ts`             | ✅  |
| 公众号搜索                    | v1.0.0 | `/api/wechat/route.ts`             | ✅  |
| Cookie登录                   | v1.0.0 | `/api/wechat/route.ts`             | ✅  |
| 二维码登录                    | v1.0.0 | `/api/wechat/route.ts`             | ✅  |

### 8.2 与AIWriteX功能对比

| AIWriteX功能 | 当前系统状态 | 说明 |
|-------------|------------|------|
| 文章采集下载 | ✅ 已实现 | 支持公众号搜索、文章列表、批量下载 |
| 写作风格模板 | ✅ 已实现 | 6种写作风格，支持风格采集和分析 |
| 排版风格模板 | ✅ 已实现 | 5种排版风格，AIWriteX风格排版 |
| AI改写润色 | ✅ 已实现 | 完整的8步SOP流程 |
| AI配图生成 | ✅ 已实现 | MiniMax文生图API |
| 微信发布 | ✅ 已实现 | 草稿箱发布、多账号支持 |
| 闭环优化系统 | ✅ 已实现 | 差距分析、优化建议、人工审核 |
| 去AI味检测 | ✅ 已实现 | 24种模式检测、质量评分 |
| 热点雷达 | ⚠️ 部分实现 | 有热点话题API，未深度整合 |
| 多智能体协作 | ❌ 未实现 | 可考虑引入CrewAI框架 |
| 小说连载系统 | ❌ 未实现 | 需要三层记忆矩阵等复杂架构 |
| 手机机器人控制 | ❌ 未实现 | 需要QQ/钉钉/飞书等平台集成 |
| 实时搜索 | ❌ 未实现 | AIForge实时搜索未集成 |
| 创意变换系统 | ❌ 未实现 | 维度化创意变换未实现 |

### 8.3 建议优化方向

**高优先级（建议近期实现）：**
1. **热点雷达深度整合** - 整合微博/抖音/小红书热搜数据
2. **实时搜索集成** - 引入AIForge或类似服务获取实时资讯
3. **创意变换系统** - 同一素材多风格变换功能

**中优先级（可规划实现）：**
1. **多智能体协作** - 引入CrewAI实现角色分工
2. **模板系统增强** - 按话题分类的模板库
3. **黑马话题挖掘** - 流量预测引擎

**低优先级（长期规划）：**
1. **小说连载系统** - 需要大量架构设计
2. **手机机器人控制** - 需要多平台适配
3. **多用户系统** - 企业级功能

***

## 九、安全性说明

### 9.1 敏感信息存储

所有敏感信息均存储在本地SQLite数据库中，不会上传到GitHub：

| 敏感信息 | 存储位置 | 用途 |
|---------|---------|------|
| LLM API Key | `llmConfigs` 表 | 调用大模型API |
| 微信 AppId | `wechatAccounts` 表 | 微信公众号API |
| 微信 AppSecret | `wechatAccounts` 表 | 微信公众号API |
| 微信 Token | `wechatAuth` 表 | 微信登录凭证 |
| 微信 Cookie | `wechatSessions` 表 | 微信会话保持 |

### 9.2 .gitignore 配置

以下文件/目录不会被上传到GitHub：

```
# 数据库文件
*.db, *.sqlite, data/

# 环境变量
.env, .env.local, .env.*.local

# 上传文件
uploads/, public/uploads/

# 会话数据
.sessions/

# 动态生成
public/wx_qrcode.png
```

### 9.3 部署前检查清单

上传到公开仓库前，请确认：

- [ ] 数据库文件(*.db)已被忽略
- [ ] 环境变量文件已被忽略
- [ ] 无硬编码的API密钥
- [ ] 无硬编码的密码或令牌
- [ ] 上传目录已被忽略
- [ ] 日志文件已被忽略

***

## 十、后续开发计划

### 优先级高 (v1.2.0)

1. 完善订阅监控的定时任务调度
2. 添加邮件/微信通知功能
3. 优化大量文章时的性能

### 优先级中 (v1.3.0)

1. 添加文章分类和标签管理
2. 实现文章全文搜索
3. 添加数据统计和可视化

### 优先级低 (v2.0.0)

1. 支持多用户系统
2. 添加 API 访问频率限制
3. 支持插件扩展

***

*本文档版本: v1.3.3*
*最后更新: 2026-03-31*
*版本更新日志: [CHANGELOG.md](./CHANGELOG.md)*
