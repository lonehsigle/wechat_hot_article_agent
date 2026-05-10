export type DataSourceStatus = 'ready' | 'degraded' | 'blocked';

export interface DataSourceContract {
  id: string;
  name: string;
  status: DataSourceStatus;
  sourceType: 'database' | 'external_api' | 'search' | 'llm' | 'manual' | 'worker';
  truthBoundary: string;
  requiredConfig: string[];
  notes: string[];
}

function hasEnv(name: string): boolean {
  return !!process.env[name];
}

export function getDataSourceContracts(): DataSourceContract[] {
  const allowDemoData = process.env.ALLOW_DEMO_DATA === 'true';
  const hasWorkerToken = hasEnv('INTERNAL_WORKER_TOKEN');

  return [
    {
      id: 'postgres',
      name: 'PostgreSQL 业务数据库',
      status: hasEnv('DATABASE_URL') ? 'ready' : 'degraded',
      sourceType: 'database',
      truthBoundary: '系统内持久化记录，以数据库连接和表结构为准。',
      requiredConfig: ['DATABASE_URL'],
      notes: hasEnv('DATABASE_URL')
        ? ['已配置显式数据库连接。']
        : ['未配置 DATABASE_URL 时会使用本地开发默认连接，只适合开发环境。'],
    },
    {
      id: 'wechat-official-api',
      name: '微信公众号官方接口',
      status: 'degraded',
      sourceType: 'external_api',
      truthBoundary: '发布、素材上传和统计同步只能以微信接口返回为准。',
      requiredConfig: ['wechat_accounts.app_id', 'wechat_accounts.app_secret'],
      notes: ['接口适配已实现，账号配置保存在服务端数据库；草稿列表、发布、素材上传和统计同步必须通过显式接口或任务运行。'],
    },
    {
      id: 'wechat-mp-session',
      name: '微信公众号后台会话采集',
      status: 'degraded',
      sourceType: 'external_api',
      truthBoundary: '依赖人工扫码后的会话 cookie，只能手动触发单次采集。',
      requiredConfig: ['wechat_sessions.auth_key', 'wechat_sessions.cookies'],
      notes: ['API Route 不承载常驻轮询；定时监控需要独立 worker。'],
    },
    {
      id: 'external-search',
      name: '外部搜索结果',
      status: 'degraded',
      sourceType: 'search',
      truthBoundary: '选题素材的外链和摘要来自真实搜索结果；搜索失败不能伪造 URL。',
      requiredConfig: [],
      notes: ['当前统一搜索会返回错误信息；调用方必须把失败显式暴露给用户。'],
    },
    {
      id: 'llm-generated-materials',
      name: 'LLM 生成素材',
      status: 'degraded',
      sourceType: 'llm',
      truthBoundary: 'LLM 输出只作为创作草稿，不作为事实来源。',
      requiredConfig: ['llm_configs 或 OPENAI_API_KEY'],
      notes: ['生成内容必须保留 AI生成、待核验、基于搜索摘要等标记。'],
    },
    {
      id: 'demo-data',
      name: '演示数据',
      status: allowDemoData ? 'degraded' : 'blocked',
      sourceType: 'manual',
      truthBoundary: '演示数据只能用于开发演示，不能作为生产事实。',
      requiredConfig: ['ALLOW_DEMO_DATA=true'],
      notes: allowDemoData
        ? ['演示数据已开启，生产环境不应使用。']
        : ['演示数据默认禁用，相关能力应返回 501 或明确失败。'],
    },
    {
      id: 'worker-runner',
      name: '独立任务 worker',
      status: hasWorkerToken ? 'degraded' : 'blocked',
      sourceType: 'worker',
      truthBoundary: '长任务和定时任务需要由外部 worker 显式调用任务接口。',
      requiredConfig: ['INTERNAL_WORKER_TOKEN'],
      notes: hasWorkerToken
        ? ['已配置 worker token；仍需外部进程按计划调用 /api/jobs。']
        : ['未配置 worker token；当前只支持登录用户手动运行任务。'],
    },
  ];
}

export function summarizeDataSources() {
  const sources = getDataSourceContracts();
  return {
    total: sources.length,
    ready: sources.filter(source => source.status === 'ready').length,
    degraded: sources.filter(source => source.status === 'degraded').length,
    blocked: sources.filter(source => source.status === 'blocked').length,
  };
}
