# 开发文档

## 版本: 1.10.0
## 更新日期: 2026-04-18

### UI 优化
1. **LandingPage 主色调统一**: 将所有蓝色 `#3b82f6` 替换为橙色 `#E8652D`
   - heroHighlight 渐变、registerBtn、primaryBtn、stats 背景、ctaBtn、submitBtn、switchBtn
2. **Dashboard 响应式布局**: 将固定列数的 grid 改为 `auto-fit` 响应式布局
   - statsGrid: `repeat(auto-fit, minmax(200px, 1fr))`
   - quickActionsGrid: `repeat(auto-fit, minmax(180px, 1fr))`
   - bottomGrid: `repeat(auto-fit, minmax(300px, 1fr))`
3. **App 页面 header 修复**: 添加 `ipPlan` 移动端标题映射

---

## 版本: 1.9.0
## 更新日期: 2026-04-18

### 安全性修复
1. **API 认证中间件**: 新增 `src/lib/auth.ts` 统一认证模块
   - `verifyAuth(request)`：验证请求中的 auth_token Cookie，返回认证结果
   - `unauthorizedResponse()`：返回统一的 401 未认证响应
   - 支持会话过期检查、账号禁用检查
2. **IP方案 API 添加认证保护**: `/api/ip-plans` 所有接口（GET/POST）添加 `verifyAuth` 认证检查
3. **公众号账号 API 添加认证保护**: `/api/wechat-accounts` 所有接口（GET/POST/PUT/DELETE）添加认证检查
4. **LLM配置 API 添加认证保护**: `/api/llm-config` 所有接口（GET/POST/DELETE）添加认证检查
5. **已发布文章 API 添加认证保护**: `/api/published-articles` 所有接口（GET/POST/PUT）添加认证检查

### 错误处理优化
6. **hot-topics 搜索添加分页**: 支持 `page` 和 `pageSize` 参数，限制最大 pageSize 为 100，防止大数据量查询
7. **JSON 解析安全**: 新增 `safeJsonParse<T>()` 工具函数，解析失败返回 null 而非抛出异常

---

## 版本: 1.8.0
## 更新日期: 2026-04-18

### 新增功能
1. **IP方案模块**: 新增完整的IP方案创建与管理功能
   - 数据库: 新增 `ip_plans` 表，包含行业、账号包装、人设定制、执行计划、变现路径等字段
   - API: 新增 `/api/ip-plans` 路由，支持创建、列表、详情、更新、删除操作
   - 前端: 新增 `IPPlanPage` 组件，5步向导式创建流程（选择行业→账号包装→人设定制→执行计划→变现路径）
   - 导航: 侧边栏"创作"分组新增"IP方案"入口
   - 工作台: DashboardPage快速入口新增"IP方案"卡片

### 数据库变更
- 新增 `ip_plans` 表（schema.pg.ts）
  - id, name, industry, industry_analysis, account_name, account_avatar, account_bio, account_style
  - persona_name, persona_traits, persona_story, persona_voice
  - execution_plan, content_calendar, milestones
  - monetization_path, revenue_model, pricing_strategy
  - status, created_at, updated_at

### API变更
- `GET /api/ip-plans?action=list` - 获取IP方案列表
- `GET /api/ip-plans?action=detail&id=N` - 获取IP方案详情
- `POST /api/ip-plans` body: `{action: "create", ...}` - 创建IP方案
- `POST /api/ip-plans` body: `{action: "update", id: N, ...}` - 更新IP方案
- `POST /api/ip-plans` body: `{action: "delete", id: N}` - 删除IP方案

---

## 版本: 1.7.0
## 更新日期: 2026-04-18

### 新增功能
1. **用户使用流程与说明文档**: 新增 `docs/USAGE_GUIDE.md`，包含完整的程序使用流程说明
   - 环境准备与安装指南（本地开发环境和Docker两种方式）
   - 首次启动与登录流程
   - 系统设置配置说明（LLM配置、公众号配置、图片生成、菜单管理、Prompt管理）
   - 8大核心功能详细操作步骤（文章采集、公众号采集、热门选题、选题分析、创作工作台、待发布管理、数据分析、闭环优化）
   - 完整工作流示例（从选题到发布的6步流程）
   - 常见问题FAQ（7个常见问题及解决方案）
   - 功能模块与菜单对照表
   - LLM服务商与模型对照表
   - 搜索引擎对照表

---

## 版本: 1.6.0
## 更新日期: 2026-04-18

### 修复 Bug
1. **API响应格式统一（99处）**: 所有API路由的错误响应统一为 `{ success: false, error: ... }` 格式，成功响应统一为 `{ success: true, ... }` 格式
   - 批量修复22个API路由文件中 `NextResponse.json({ error: ... })` 缺少 `success: false` 的问题
   - 修复 `analysis`, `topic-analysis`, `wechat-collect`, `hot-radar`, `monitor`, `publish`, `style-analysis`, `image-generation`, `styles` 等路由中成功响应缺少 `success: true` 的问题

2. **API错误处理缺失修复**: 多个API路由的GET/POST处理器缺少try/catch错误捕获
   - `hot-radar/route.ts`: GET和POST添加try/catch和JSON解析保护
   - `monitor/route.ts`: GET和POST添加try/catch
   - `wechat-collect/route.ts`: POST添加JSON解析保护和try/catch
   - `styles/route.ts`: POST添加JSON解析保护和save/delete操作的try/catch

3. **API参数验证缺失修复**: 多个API路由缺少关键参数验证
   - `create-workshop/route.ts`: 12个操作添加参数验证（web-search, generate-article, check-ai, humanize-content, polish-content, generate-title, evaluate-title, generate-opening, generate-ending, analyze-content, rewrite-article, decompose-article, generate-body, full-creation-workflow, pre-publish-evaluation, full-sop-workflow, delete-rewrite）
   - `wechat-collect/route.ts`: delete-subscription和start-collect添加参数验证
   - `publish/route.ts`: search-images, upload-image, preview-html添加参数验证
   - `styles/route.ts`: save, delete, save-layout, delete-layout添加参数验证

4. **parseInt NaN防护**: 多处parseInt缺少NaN检查，可能导致数据库查询异常
   - `hot-radar/route.ts`: topicId添加NaN检查
   - `analysis/route.ts`: taskId添加NaN检查
   - `crawler/route.ts`: postId添加NaN检查
   - `benchmark/route.ts`: accountId和id添加NaN检查
   - `wechat-collect/route.ts`: subscriptionId添加NaN检查
   - `wechat-collect/export/route.ts`: articleId添加NaN检查
   - `wechat-config/route.ts`: id添加NaN检查
   - `materials/route.ts`: topicId和id添加NaN检查
   - `create-workshop/route.ts`: styleId和layoutId添加NaN检查
   - `optimization-loop/route.ts`: limit, offset, count添加NaN防护

5. **类型安全修复**: 替换不安全的类型断言
   - `optimization-loop/route.ts`: `Record<string, unknown>` 改为 `Partial<typeof table.$inferInsert>`
   - `wechat-collect/route.ts`: `Record<string, unknown>` 改为 `Partial<typeof collectedArticles.$inferInsert>`
   - `create-workshop/route.ts`: `any` 改为 `Record<string, unknown>` 和具体类型
   - `style-analysis/route.ts`: `any` 改为 `{ name: string }`
   - `styles/route.ts`: 添加类型断言和参数类型定义

6. **前端API响应解包修复**: 前端组件需要正确处理后端统一的 `{ success: true, ... }` 响应格式
   - `page.tsx`: loadMaterials, loadWritingStyles, loadBenchmarkAccounts, loadViralTitles, addBenchmarkAccount, importViralTitles 修复响应解包逻辑

7. **前端内存泄漏修复**: 多个组件的useEffect中fetch请求缺少AbortController清理
   - `DashboardPage.tsx`: 添加AbortController和signal传递
   - `PublishedArticlesPage.tsx`: 添加AbortController和AbortError处理
   - `AnalyticsPanel.tsx`: 添加AbortController和signal传递
   - `CrawlerPage.tsx`: 添加AbortController和signal传递
   - `PendingPublishPage.tsx`: 添加AbortController和signal传递
   - `PromptManager.tsx`: 添加AbortController和signal传递

8. **LLM服务超时控制**: callLLM和streamLLM函数的fetch请求缺少超时控制
   - `callLLM`: 添加120秒AbortController超时控制（Anthropic和OpenAI格式）
   - `streamLLM`: 添加300秒AbortController超时控制，添加超时错误处理

9. **Jina爬虫超时控制**: fetchWithJina函数缺少超时控制
   - 添加30秒AbortController超时控制
   - 添加超时错误消息

10. **重复代码消除**: hot-radar/route.ts中存在重复的callLLM函数
   - 删除硬编码的DeepSeek API调用
   - 改为使用共享的 `@/lib/llm/service` 中的callLLM
   - 尊重用户配置的LLM提供商和模型

11. **API响应格式一致性**: 多个API路由成功响应缺少success字段
   - `wechat-collect/route.ts`: list-articles, list-subscriptions, list-tasks, check-auth, check-scan-status 添加success字段
   - `analysis/route.ts`: status, report, list 添加success字段
   - `hot-radar/route.ts`: trend-analysis, recommendations, keywords, link-workshop, smart-collect 添加success字段
   - `monitor/route.ts`: status, logs, black-horses 添加success字段
   - `publish/route.ts`: search-images, upload-image, preview-html 添加success字段
   - `topic-analysis/route.ts`: get-wordcloud-cache, ai-wordcloud, analyze, generate-analysis-report 添加success字段
   - `create-workshop/route.ts`: get-prompts 添加success字段
   - `style-analysis/route.ts`: list 添加success字段

---

## 版本: 1.5.0
## 更新日期: 2026-04-18

### 修复 Bug
1. **create-workshop callWebSearch失败时返回success=true修复**: 搜索失败时返回 `success: true` 是严重逻辑错误，前端无法区分搜索成功和失败
   - 改为失败时返回 `success: false, error: '搜索失败，请稍后重试'`

2. **benchmark PUT操作...data展开安全漏洞修复**: `...data` 展开允许客户端修改任意数据库字段（如id、createdAt等），是安全漏洞
   - 改为显式列出允许更新的字段，使用条件展开 `...(field !== undefined && { field })`

3. **hot-topics LIKE注入风险修复**: 搜索功能中 `%`、`_`、`\` 是SQL LIKE通配符，用户可通过特殊字符匹配非预期数据
   - 增加转义处理 `keyword.replace(/[%_\\]/g, '\\$&')`

4. **hot-topics 随机数作为评分修复**: `aiScore: Math.random() * 30 + 70` 和 `humanScore: Math.random() * 20 + 80` 使用随机数作为评分，会误导用户
   - 改为 `null`，表示评分尚未计算

5. **evaluate API响应格式统一修复**: 所有响应缺少 `success` 字段，GET处理器缺少try/catch
   - 所有响应统一添加 `success` 字段
   - GET处理器添加try/catch错误处理

6. **crawler API GET/POST处理器添加try/catch**: 两个处理器均无错误捕获，数据库异常将导致未捕获的500错误
   - 添加try/catch和统一的错误响应格式
   - 添加parseInt的NaN防护

7. **publish API GET处理器添加try/catch和NaN防护**: 无错误捕获，parseInt无NaN检查
   - 添加try/catch、NaN防护、统一响应格式

8. **hot-topics GET处理器添加try/catch和NaN防护**: 无错误捕获，parseInt无NaN检查，响应格式不统一
   - 添加try/catch、NaN防护、统一 `success` 响应格式

9. **create-workshop decomposeArticle失败时静默返回占位数据修复**: 失败时返回"分析中..."占位文本，前端无法区分真实数据和占位数据
   - 改为返回空字符串和 `_decomposeFailed: true` 标记

---

## 版本: 1.4.0
## 更新日期: 2026-04-18

### 修复 Bug
1. **monitor-config Drizzle ORM语法错误修复**: `.where((t: any) => t.id.eq(category.id))` 是错误的Drizzle ORM语法，会导致运行时崩溃
   - 改为 `.where(eq(monitorCategories.id, category.id))`
   - 修复逻辑：当category.id存在但数据库中无对应记录时，改为插入新记录而非更新

2. **analysis/process keywords存储格式不一致修复**: `process/route.ts` 将keywords存储为逗号分隔字符串 `join(',')`，但 `analysis/route.ts` 读取时期望为数组
   - 统一改为 `JSON.stringify()` 序列化存储，确保读取时格式一致

3. **wechat-drafts 多项逻辑问题修复**:
   - `listDrafts` 中 `whereCondition` 为 `undefined` 时传给 `.where()` 可能导致异常，改为条件构建查询
   - `getDraft` 缺少id格式验证（非数字时崩溃），增加 `parseInt` 和 `isNaN` 检查
   - `searchDrafts` 存在SQL注入风险（未转义LIKE通配符 `%`、`_`、`\`），增加转义处理
   - `updateDraft` 使用 `Record<string, unknown>` 绕过类型安全，改为 `Partial<typeof wechatDrafts.$inferInsert>`
   - `updateDraft` 缺少status值验证，增加合法值检查
   - 多处错误响应缺少 `success: false` 字段，统一响应格式

4. **segment API响应格式不一致修复**: 错误响应缺少 `success: false` 字段
   - 所有错误响应统一添加 `success: false`

5. **wechat-config缺少字段验证修复**: 创建账号时 `name` 是必填字段但未验证
   - 增加 `name` 非空验证

6. **OptimizationLoop API响应解包修复**: `fetchData`/`fetchSourceContents`/`fetchSuggestions` 直接使用 `data.articles`/`data.contents`/`data.suggestions`，未检查 `success` 字段
   - 统一改为 `data.success ? (data.xxx || []) : []`

7. **subscriptions API响应格式不一致修复**: 错误响应缺少 `success: false` 字段
   - 所有错误响应统一添加 `success: false`

---

## 版本: 1.3.1
## 更新日期: 2026-04-18

### 修复 Bug
1. **CreateWorkbench/types.ts 账号查找引用错误修复**: 提取 `accounts` 数组后仍用 `data.accounts.find()`，导致默认账号查找失败
   - 改为 `accounts.find()`

2. **CreateWorkbench/types.ts 布局样式响应格式修复**: `/api/styles?type=layout` 使用 `successResponse()` 包装，但前端用 `Array.isArray(data)` 检查
   - 统一使用正确的解包逻辑

3. **style-analysis API GET 响应格式统一**: 直接返回 `NextResponse.json(styles)` 不符合项目规范
   - 改为使用 `successResponse(styles)` 保持一致性

4. **rewrite API system/user prompt 分离**: 3处 `callLLM` 调用将 system prompt 和 user prompt 合并为一个 `user` 消息
   - 拆分为独立的 `{ role: 'system' }` 和 `{ role: 'user' }` 消息
   - 影响：单篇改写、多篇合并改写、话题改写三个功能

5. **seo-optimize apply-optimization 类型修复**: `updateData` 声明为 `Record<string, string>` 但 `updatedAt` 是 `Date` 类型
   - 改为 `Record<string, unknown>`
   - 补充缺失的 `updatedAt` 字段更新

---

## 版本: 1.3.0
## 更新日期: 2026-04-18

### 修复 Bug
1. **系统性修复 API 响应格式不匹配问题（MINOR级别）**:
   - 后端 API 统一使用 `successResponse()` 包装响应为 `{ success: true, data: ... }`，但多个前端组件用 `Array.isArray(data)` 直接检查响应，导致数据永远为空
   - 新增前端 API 响应解包工具函数 `unwrapApiResponse` / `unwrapApiArray`（`src/lib/utils/api-helper.ts`）
   - 修复 `app/page.tsx` 中 `loadWechatAccounts` 解包错误和 `targetAudience`/`readerPersona` 字段缺失
   - 修复 `app/page.tsx` 中 `saveWechatAccount` POST 响应解包错误
   - 修复 `StyleAnalyzerPage` 中 `/api/styles` 响应格式不匹配
   - 修复 `WritingTechniquesPage` 中 `/api/writing-techniques` 响应格式不匹配
   - 修复 `CreateWorkbench/types.ts` 中 `/api/wechat-collect` 和 `/api/wechat-accounts` 响应格式不匹配
   - 修复 `TopicAnalysisPage` 中 `/api/wechat-collect` 响应格式不匹配

2. **optimization-loop 统计数据更新逻辑修复**:
   - `handleUpdateStats` 使用 `data.readCount || 0`，当值为 0 时 `|| 0` 会将 0 覆盖为 0（虽然结果一样但语义错误）
   - 更严重的是：当只更新部分字段时，未提供的字段也被设为 0，覆盖了原有数据
   - 改为只更新明确提供的字段（`!== undefined` 检查）

---

## 版本: 1.2.2
## 更新日期: 2026-04-18

### 修复 Bug
1. **DashboardPage API 响应格式不匹配修复**: `published-articles` API 使用 `successResponse()` 包装为 `{ success: true, data: [...] }`，但 DashboardPage 用 `Array.isArray()` 直接检查响应，导致统计数据永远为0
   - 现在正确解包 `successResponse` 格式的响应
   - 同时兼容直接返回数组的旧格式

2. **TopicAnalysisPage Math.max 空数组导致 -Infinity 修复**: `Math.max(...(wordCloud.map(w => w.count) || [1]))` 中空数组的 `.map()` 返回 `[]`（truthy），`|| [1]` 永远不触发，`Math.max(...[])` 返回 `-Infinity`
   - 改为先检查数组长度，空数组时返回默认值 1

3. **TopicAnalysisPage generateWordCloud 死代码移除**: 约90行 `generateWordCloud` 函数从未被调用（组件使用 `/api/segment` 端点），移除以减少包体积

4. **LandingPage 模式切换不清除表单修复**: 切换登录/注册模式时不清除已输入的表单数据和错误信息，可能导致用户困惑
   - 切换时重置所有表单字段和错误提示

5. **TopicAnalysisPage AI 分析 API 密钥检查增强**: `runAIAnalysis` 只检查 `llmConfig` 存在性，不检查 `hasApiKey`，导致配置了服务商但未填密钥时仍可触发分析
   - 增加 `hasApiKey` 检查
   - 提示信息从硬编码 "MiniMax API" 改为通用 "LLM API密钥"

6. **createWechatAccount/updateWechatAccount 参数补全**: 数据库查询函数签名缺少 `targetAudience` 和 `readerPersona` 字段，导致即使 API 传入这些字段也无法写入数据库
   - 补全函数签名和 values 映射

7. **WechatCollectPage DOMPurify 安全增强**: 
   - 移除无用的空 `addHook` 回调
   - 重命名 `safeSanitize` 为 `safeSanitizeHtml`，明确仅用于 HTML
   - 添加明确的 `ALLOWED_TAGS` 和 `ALLOWED_ATTR` 白名单配置
   - 白名单包含微信文章常用标签（section、figure、figcaption、dl/dt/dd、sup/sub 等）

---

## 版本: 1.2.1
## 更新日期: 2026-04-18

### 修复 Bug
1. **LLM Service baseUrl 处理逻辑修复**: 自定义 baseUrl 时不再总是追加 `/v1/messages`，而是根据服务商类型正确追加路径
   - Anthropic 服务商追加 `/v1/messages`
   - 其他服务商追加 `/v1/chat/completions`
   - 如果 baseUrl 已包含完整路径则不再追加

2. **Anthropic 服务商配置补全**: 新增 Anthropic 服务商完整配置
   - 支持 claude-3-5-sonnet、claude-3-5-haiku、claude-3-opus、claude-3-sonnet、claude-3-haiku 模型
   - streamLLM 函数支持 Anthropic 流式响应格式（content_block_delta / message_stop）
   - callLLM 函数已支持 Anthropic 格式（无需修改）

3. **LLM 模型映射补全**: 补全 UI 中可选但后端未映射的模型
   - OpenAI: 新增 gpt-4
   - DeepSeek: 新增 deepseek-reasoner
   - MiniMax: 新增 MiniMax-Text-01、abab6.5g-chat、abab6.5t-chat
   - MiniMax API 端点更正为 `https://api.minimax.chat/v1/text/chatcompletion_v2`

4. **微信文章采集时间戳双重时区转换修复**: 移除 `rawTime + 8 * 3600` 的手动时区偏移
   - 微信 ct 时间戳为标准 UTC 时间戳，JavaScript Date 自动处理时区转换
   - 手动加8小时会导致在北京时间显示时多8小时

5. **DOMPurify 误用于 CSS 内容修复**: 
   - 移除对 `mobileStyles`（CSS 内容）的 DOMPurify.sanitize 调用
   - DOMPurify 是 HTML 净化器，对 CSS 使用会错误剥离合法样式规则
   - 重命名 `safeSanitize` 为 `safeSanitizeHtml`，明确仅用于 HTML 内容
   - 移除无用的空 DOMPurify.addHook 回调
   - 为 safeSanitizeHtml 添加明确的 ALLOWED_TAGS 和 ALLOWED_ATTR 配置

6. **wechat-collect 路由 delete-article 重复定义修复**:
   - 移除 GET handler 中的 delete-article 操作（违反 RESTful 规范且不安全）
   - 前端调用改为 POST 方法，统一使用 POST handler 中的 delete-article

7. **微信账号编辑扩展字段丢失修复**:
   - saveWechatAccount 的 POST 和 PUT 请求中补充发送 targetAudience 和 readerPersona 字段
   - 创建账号后的状态更新中补充这两个字段的回填

8. **saveLLMConfig 部分更新支持**:
   - apiKey 改为可选字段，不提供时保留原值
   - 首次配置时强制要求提供 apiKey
   - llm-config API route 简化，统一使用 saveLLMConfig 函数
   - 移除冗余的 PATCH handler（POST 已支持部分更新）

9. **getProviderByModel 补全 Anthropic 识别**: 新增 `claude` 前缀模型自动识别为 anthropic 服务商

---

## 版本: 1.2.0
## 更新日期: 2026-04-11

### 新增功能
1. **多用户管理功能**: 新增完整的用户认证系统
   - 用户注册/登录/登出功能
   - 基于 Cookie 的会话管理（7天有效期）
   - 用户表和会话表存储用户数据
   - 密码使用 SHA256 加密存储

2. **展示导航首页**: 新增产品展示首页
   - 产品功能特性展示
   - 核心功能介绍卡片
   - 数据统计展示
   - 登录/注册弹窗

3. **路由保护**: 应用界面需要登录后才能访问
   - 首页自动检测登录状态
   - 已登录用户自动跳转到应用界面
   - 未登录用户显示展示导航页

### 数据库变更
1. **新增 users 表**: 存储用户账号信息
   - id, username, email, password_hash
   - display_name, avatar, role
   - is_active, last_login_at
   - created_at, updated_at

2. **新增 user_sessions 表**: 存储用户会话
   - id, user_id, token
   - user_agent, ip_address
   - expires_at, created_at

### API 变更
1. **新增 /api/auth 路由**: 用户认证接口
   - POST action=register: 用户注册
   - POST action=login: 用户登录
   - POST action=logout: 用户登出
   - GET: 检查登录状态

---

## 版本: 1.1.0
## 更新日期: 2025-04-09

### 新增功能
1. **MiniMax 搜索集成**: 新增 MiniMax 搜索功能，支持通过 Chat API 进行网络搜索
   - MiniMax 搜索使用 Chat API + web_search 工具实现智能搜索
   - 支持通过环境变量配置 API Key（`MINIMAX_API_key`, `MINIMAX_GROUP_ID`）
   - 搜索优先级：Tavily > 天工 > MiniMax > 维基百科 > Bing > DuckDuckGo > 百度 > Google

### 修复 Bug
1. **API 路由配置修复**: 修复 hot雷达 API 路由中正确传递 MiniMax API Key 配置
2. **搜索服务日志优化**: 巻加搜索配置日志，显示当前配置的 API Key 热度

3. **前端错误处理改进**: 修复热门选题搜索前端错误处理， 显示空数据时正确提示错误信息

4. **环境变量示例更新**: 更新 `.env.local.example` 添加 MiniMax 相关配置

5. **开发文档更新**: 更新接口文档、数据库文档、代码注释等

---

## 版本: 1.0.1 → 1.1.0
## 更新日期: 2025-04-09

### 新增功能
1. **MiniMax 搜索集成**: 新增 MiniMax 搜索功能，支持通过 Chat API 进行网络搜索
   - MiniMax 搜索使用 Chat API + web_search 工具实现智能搜索
   - 支持通过环境变量配置 API Key（`MINIMAX_API_KEY`, `MINIMAX_GROUP_ID`)
)
   - 搜索优先级: Tavily > 天工 > MiniMax > 维基百科 > Bing > DuckDuckGo > 百度 > Google

### 修复 Bug
1. **API 路由配置修复**: 修复热雷达 API 路由中正确传递 MiniMax API Key 配置
2. **搜索服务日志优化**: 添加搜索配置日志，显示当前配置的 API Key 烘度
3. **前端错误处理改进**: 修复热门选题搜索前端错误处理, 显示空数据时正确提示错误信息
4. **环境变量示例更新**: 更新 `.env.local.example` 添加 MiniMax 相关配置
5. **开发文档更新**: 更新接口文档、数据库文档、代码注释等

