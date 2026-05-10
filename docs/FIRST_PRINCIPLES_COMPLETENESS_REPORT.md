# 第一性原理功能完整度与优化方案

## 你的需求是什么

你的需求是把当前程序作为一个真实的内容运营系统来审查和完善，而不是只看代码是否“有功能名”。标准是：

1. 真实闭环：发现选题、采集素材、生成/改写、进入公众号草稿、发布、回收阅读互动数据、复盘优化，每一步都要能说清真实执行器、真实数据源和失败边界。
2. 真实能力：界面上的按钮和 API 成功响应必须对应真实业务动作；没有 worker、没有队列、没有数据源、没有权限时必须显示 blocked/degraded 或返回 501，不能伪装成功。
3. 真实来源：外部信息需求必须基于可核验来源。公众号走微信官方接口；抖音、小红书等平台如果没有已配置的官方/第三方数据源，就只能作为待接入能力或人工导入能力。
4. 真实安全：git 不应保存密钥、token、cookie、私有配置；运行凭据只放环境变量或服务端安全存储。
5. 外科式优化：保留现有架构中可工作的部分，优先处理产品契约级隐患，再按小步任务补齐能力，不做无验证的大重构。

## 信息需求基线

内容监控产品的最小真实闭环是：发现选题、采集可核验素材、生成或改写内容、进入公众号草稿、发布、回收阅读/互动数据、形成复盘建议。任何环节如果没有真实来源或真实执行器，都必须显示为不可用或降级，不能用演示数据、后台假任务或成功响应填补。

## 外部平台事实

- 微信官方提供草稿箱接口：`/cgi-bin/draft/add`、`/cgi-bin/draft/batchget`、`/cgi-bin/draft/get`、`/cgi-bin/draft/count`、`/cgi-bin/draft/delete`。
- 微信官方提供发布能力：`/cgi-bin/freepublish/submit`、`/cgi-bin/freepublish/get`、`/cgi-bin/freepublish/batchget`、`/cgi-bin/freepublish/getarticle`。官方说明 2025 年 7 月起部分主体账号会被回收发布接口调用权限。
- 微信官方提供图文统计接口：`/datacube/getarticlesummary`、`/datacube/getuserread`、`/datacube/getarticletotal` 等，并说明小阅读量内容可能无法返回统计结果。
- 抖音开放平台存在 OpenAPI 列表和内容/互动等授权接口，但这不等于本系统已拥有“无认证热点榜采集”能力；生产使用应走官方授权、第三方合规数据源、人工导入或独立 crawler-worker。
- 小红书等平台同理：未配置官方/第三方数据源前，不能把平台热点作为 ready 能力。

## 当前已补齐

- `/api/wechat-drafts action=sync` 已接入微信官方 `draft/batchget`，不再把可实现能力误标为 blocked。
- `/api/analytics` 不再在 GET 中隐式同步，只返回 `syncStatus`；同步通过 `/api/analytics/sync` 或 `/api/jobs` 显式触发。
- `/api/jobs` 提供任务契约，外部 worker 必须通过 `INTERNAL_WORKER_TOKEN` 明确调用。
- `/api/system/capabilities` 和 `/api/ops/status` 暴露 ready/degraded/blocked 状态，便于直接判断实战可用面。
- 演示数据默认关闭；需要 `ALLOW_DEMO_DATA=true` 才能走演示路径。

## 当前结论

当前程序已经满足“第一性原理第一阶段”：不再用假调度、假后台、假数据、隐式同步来伪装完成度，并且已有能力清单、任务入口、运维状态和验证门禁。

但它还没有满足“完整实战闭环”的最终标准。核心缺口不是 UI 层，而是微信账号权限探测、发布状态回填、datacube 统计增强、外部热点源契约、前端运营可见性、worker 运行持久化和素材事实核验。

## Todo 稳定机制

为避免上下文压缩后 todo 漂移，当前优化路线已经拆成四层：

- `docs/specs/systematic-optimization.spec.md`：锁定需求基线。
- `docs/specs/systematic-optimization.tasks.md`：锁定任务清单。
- `docs/specs/systematic-optimization.ledger.md`：唯一可变状态表。
- `docs/specs/systematic-optimization.evidence.md`：验证证据。

`docs/specs/systematic-optimization.manifest` 保存 spec/tasks 的 SHA-256。`bash scripts/verify-specs.sh` 会检查基线是否被静默修改，并已接入 `npm run verify`。

## 完善优化方案

### 路线一：账号能力探测

目标：让系统知道每个公众号账号到底能不能用，而不是等发布/同步失败时才暴露。

实现：增加 account capability check，覆盖 access_token、draft/batchget、freepublish/get 或 batchget、datacube 读取权限；结果进入 `/api/system/capabilities` 和 `/api/ops/status`。

验收：缺配置、无权限、接口被回收、接口有权限但无数据，都有明确状态和测试覆盖。

### 路线二：官方统计增强

目标：复盘不是只看单篇文章返回信息，而是形成按天、按来源、按趋势的公众号数据闭环。

实现：新增 datacube 客户端，最小接入 `/datacube/getarticlesummary`、`/datacube/getuserread`、`/datacube/getarticletotal`；写入 `article_stats_daily`。

验收：同步只能通过 `/api/analytics/sync` 或 `/api/jobs` 显式触发；低阅读量不返回统计时显示“平台无统计数据”，不是失败或 0 冒充。

### 路线三：发布闭环补齐

目标：草稿、提交发布、发布状态、已发布文章 URL、统计 ID 不再混淆。

实现：增加 `freepublish/get` 和 `freepublish/batchget`，回填发布状态、URL、失败原因；区分 `media_id`、`publish_id`、`msg_data_id`。

验收：从草稿创建到发布回填有测试覆盖，发布失败原因能被用户和运维状态看到。

### 路线四：外部热点源治理

目标：平台热点源必须有契约，不能用不稳定抓取或 mock 冒充生产能力。

实现：对每个平台增加 `sourceContract`：`official-api`、`third-party-api`、`manual-import`、`crawler-worker`、`demo-only`；未配置真实数据源的平台默认 blocked/degraded。

验收：生产模式下无真实数据源则不返回 mock 热点；人工导入成为可控替代路径。

### 路线五：前端运营状态页

目标：用户在后台一眼看出当前系统哪些能用、哪些缺配置、哪些需要 worker。

实现：把 `/api/ops/status` 接入后台，展示数据库、能力、数据源、任务、统计同步、安全配置；blocked 功能入口显示原因和下一步。

验收：不暴露密钥值，只暴露是否配置；前端测试覆盖状态加载和 blocked 提示。

### 路线六：worker 持久化

目标：任务不是“点完就没痕迹”，而是有运行记录、失败原因和审计链路。

实现：新增 `job_runs` 表；`/api/jobs` 每次执行写入 started/succeeded/failed；`/api/ops/status` 显示最后成功时间和最近失败。

验收：任务失败也有记录；外部 worker 仍通过 `INTERNAL_WORKER_TOKEN` 调用，不把常驻任务塞回 API route。

### 路线七：事实核验与来源评分

目标：内容进入发布前能区分事实、搜索摘要、模型推断和人工补充。

实现：素材增加来源评分和核验状态：URL 数、来源类型、可访问性、人工核验、LLM 推断标记。

验收：`AI生成/待核验` 素材发布前必须显式确认或被拦截；无来源素材不能静默进入生产发布链路。

## 执行顺序

优先级建议：P7 账号能力探测 -> P9 发布闭环 -> P8 官方统计增强 -> P12 job_runs -> P11 前端运维状态 -> P10 外部热点源治理 -> P13 事实核验评分。

这个顺序先补最接近真实业务闭环的微信能力，再补运维和外部数据源。这样每一步都能独立验证，也符合外科式改动。
