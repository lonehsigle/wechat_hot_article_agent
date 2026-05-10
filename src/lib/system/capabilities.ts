import { getDataSourceContracts } from './data-sources';

export type CapabilityStatus = 'ready' | 'degraded' | 'blocked';

export interface SystemCapability {
  id: string;
  name: string;
  status: CapabilityStatus;
  userVisible: boolean;
  principle: string;
  evidence: string[];
  blockers: string[];
  nextAction: string;
}

function hasEnv(name: string): boolean {
  return !!process.env[name];
}

export function getSystemCapabilities(): SystemCapability[] {
  const dataSources = getDataSourceContracts();
  const demoData = dataSources.find(source => source.id === 'demo-data');
  const worker = dataSources.find(source => source.id === 'worker-runner');
  const hasLlmEnv = hasEnv('OPENAI_API_KEY') || hasEnv('LLM_API_KEY');

  return [
    {
      id: 'article-workbench',
      name: '内容采集、改写、编辑与导出',
      status: 'ready',
      userVisible: true,
      principle: '已有数据库持久化和显式用户动作，功能可按请求执行。',
      evidence: ['wechat-collect', 'rewrite', 'article-export', 'article-download'],
      blockers: [],
      nextAction: '继续通过业务测试覆盖关键用户流。',
    },
    {
      id: 'manual-analytics-sync',
      name: '公众号文章统计手动同步',
      status: 'ready',
      userVisible: true,
      principle: '统计同步必须由用户或 worker 显式触发，不能在 GET 请求里偷偷后台运行。',
      evidence: ['/api/analytics/sync', 'job:syncArticleStats'],
      blockers: [],
      nextAction: '配置公众号账号后运行 /api/analytics/sync 或 /api/jobs。',
    },
    {
      id: 'resident-scheduler',
      name: '常驻定时调度',
      status: worker?.status === 'blocked' ? 'blocked' : 'degraded',
      userVisible: true,
      principle: 'Next.js API Route 不是可靠常驻进程，定时执行必须外置 worker。',
      evidence: ['/api/scheduler start 返回 501', '/api/jobs 提供显式运行契约'],
      blockers: worker?.status === 'blocked' ? ['未配置 INTERNAL_WORKER_TOKEN', '未部署独立 worker 进程'] : ['未部署独立 worker 进程'],
      nextAction: '用外部 cron/worker 携带 x-internal-worker-token 调用 /api/jobs。',
    },
    {
      id: 'analysis-worker',
      name: '选题分析后台长任务',
      status: 'blocked',
      userVisible: true,
      principle: '长任务不能由 API Route 自发后台执行，也不能生成模拟分析冒充结果。',
      evidence: ['/api/analysis action=start 返回 501', '/api/analysis/process 返回 501'],
      blockers: ['缺少可靠队列与 worker 执行器'],
      nextAction: '将真实分析流程接入 /api/jobs 或独立队列后再开放启动按钮。',
    },
    {
      id: 'wechat-draft-sync',
      name: '微信公众号草稿同步',
      status: 'ready',
      userVisible: true,
      principle: '草稿列表必须来自真实微信 API 或后台会话，不能凭空生成。',
      evidence: ['/api/wechat-drafts action=sync', '微信官方 /cgi-bin/draft/batchget'],
      blockers: [],
      nextAction: '配置公众号 appId/appSecret 后传入 accountId 同步草稿。',
    },
    {
      id: 'crawler-service',
      name: '通用平台爬虫采集',
      status: demoData?.status === 'degraded' ? 'degraded' : 'blocked',
      userVisible: true,
      principle: '无真实爬虫服务时不能把 mock 帖子、评论、创作者当作生产结果。',
      evidence: ['/api/crawler 演示数据默认禁用'],
      blockers: demoData?.status === 'blocked' ? ['未接入真实爬虫服务', 'ALLOW_DEMO_DATA 未开启'] : ['演示数据仅限开发'],
      nextAction: '接入真实 crawler adapter，并保留演示模式的显式开关。',
    },
    {
      id: 'hot-topic-materials',
      name: '热点素材采集',
      status: 'degraded',
      userVisible: true,
      principle: '搜索来源必须保留真实 URL；LLM 生成材料必须标注待核验。',
      evidence: ['/api/hot-topic-collect', 'unifiedSearch'],
      blockers: hasLlmEnv ? ['搜索失败时只能降级，不能伪造来源'] : ['未配置 LLM 凭据', '搜索失败时只能降级，不能伪造来源'],
      nextAction: '为生产配置稳定搜索和 LLM 凭据，并保留来源审计。',
    },
    {
      id: 'ops-observability',
      name: '运维健康与能力观测',
      status: 'ready',
      userVisible: false,
      principle: '系统应直接暴露能力、数据源、任务和配置状态。',
      evidence: ['/api/health', '/api/system/capabilities', '/api/ops/status'],
      blockers: [],
      nextAction: '把状态页接入前端运营后台。',
    },
  ];
}

export function summarizeCapabilities() {
  const capabilities = getSystemCapabilities();
  return {
    total: capabilities.length,
    ready: capabilities.filter(capability => capability.status === 'ready').length,
    degraded: capabilities.filter(capability => capability.status === 'degraded').length,
    blocked: capabilities.filter(capability => capability.status === 'blocked').length,
  };
}
