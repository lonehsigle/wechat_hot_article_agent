import { listWechatDrafts, syncAllArticleStats } from '@/lib/wechat/service';

export type JobStatus = 'ready' | 'blocked';

export interface JobRunResult {
  success: boolean;
  status: 'completed' | 'failed' | 'blocked';
  message: string;
  data?: Record<string, unknown>;
}

export interface JobDefinition {
  name: string;
  description: string;
  status: JobStatus;
  scheduleHint: string;
  requiredConfig: string[];
  blockedReason?: string;
  run: () => Promise<JobRunResult>;
}

function blockedJob(
  name: string,
  description: string,
  scheduleHint: string,
  requiredConfig: string[],
  blockedReason: string
): JobDefinition {
  return {
    name,
    description,
    status: 'blocked',
    scheduleHint,
    requiredConfig,
    blockedReason,
    run: async () => ({
      success: false,
      status: 'blocked',
      message: blockedReason,
    }),
  };
}

export function getJobDefinitions(): JobDefinition[] {
  return [
    {
      name: 'syncArticleStats',
      description: '同步已发布公众号文章统计数据',
      status: 'ready',
      scheduleHint: '建议由外部 worker 每 30 分钟显式触发一次。',
      requiredConfig: ['wechat_accounts.app_id', 'wechat_accounts.app_secret'],
      run: async () => {
        const result = await syncAllArticleStats({ force: true });
        if (!result.success) {
          return {
            success: false,
            status: 'failed',
            message: result.error || '文章统计同步失败',
            data: { synced: result.synced, failed: result.failed, skipped: result.skipped },
          };
        }

        return {
          success: true,
          status: 'completed',
          message: '文章统计同步完成',
          data: {
            synced: result.synced,
            failed: result.failed,
            skipped: result.skipped,
            details: result.details,
          },
        };
      },
    },
    {
      name: 'syncWechatDrafts',
      description: '同步微信公众号草稿箱列表',
      status: 'ready',
      scheduleHint: '建议由外部 worker 每 15 分钟显式触发一次。',
      requiredConfig: ['wechat_accounts.app_id', 'wechat_accounts.app_secret', 'accountId'],
      run: async () => {
        const accountId = Number(process.env.DEFAULT_WECHAT_ACCOUNT_ID || '1');
        const result = await listWechatDrafts(accountId, { count: 20, noContent: false });
        return {
          success: true,
          status: 'completed',
          message: '微信公众号草稿列表读取完成',
          data: {
            accountId,
            totalCount: result.totalCount,
            itemCount: result.itemCount,
            fetched: result.items.length,
          },
        };
      },
    },
    blockedJob(
      'processAnalysisQueue',
      '处理选题分析队列',
      '接入可靠队列后由 worker 连续消费。',
      ['队列服务', 'LLM 配置'],
      '选题分析后台处理需要可靠 worker/队列承载，当前不执行模拟分析或后台长任务。'
    ),
    blockedJob(
      'refreshHotTopics',
      '刷新热点数据缓存',
      '接入真实热点源后可每 10 分钟运行。',
      ['真实热点数据源'],
      '热点缓存自动更新尚未接入真实数据源，请在热门选题页面手动拉取真实热点。'
    ),
  ];
}

export function listJobs() {
  return getJobDefinitions().map(({ run: _run, ...job }) => job);
}

export function getJobDefinition(name: string): JobDefinition | undefined {
  return getJobDefinitions().find(job => job.name === name);
}
