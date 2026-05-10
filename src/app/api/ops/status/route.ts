import { NextResponse } from 'next/server';
import { desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { articleStats } from '@/lib/db/schema';
import { getSystemCapabilities, summarizeCapabilities } from '@/lib/system/capabilities';
import { getDataSourceContracts, summarizeDataSources } from '@/lib/system/data-sources';
import { listJobs } from '@/lib/jobs/registry';
import { getRecentJobRuns } from '@/lib/ops/job-runs';

const STATS_STALE_AFTER_MINUTES = 30;

async function getDatabaseStatus() {
  try {
    await db().execute('select 1');
    return { status: 'ok' as const, message: '数据库连接正常' };
  } catch (error) {
    return {
      status: 'error' as const,
      message: error instanceof Error ? error.message : '数据库连接失败',
    };
  }
}

async function getAnalyticsSyncStatus() {
  try {
    const latestStats = await db()
      .select()
      .from(articleStats)
      .orderBy(desc(articleStats.recordTime))
      .limit(1);

    const latestRecordTime = latestStats[0]?.recordTime || null;
    const staleBefore = new Date(Date.now() - STATS_STALE_AFTER_MINUTES * 60 * 1000);

    return {
      status: latestRecordTime && latestRecordTime >= staleBefore ? 'ok' : 'warning',
      needsSync: !latestRecordTime || latestRecordTime < staleBefore,
      latestRecordTime,
      staleAfterMinutes: STATS_STALE_AFTER_MINUTES,
      syncEndpoint: '/api/analytics/sync',
      jobName: 'syncArticleStats',
    };
  } catch (error) {
    return {
      status: 'error',
      needsSync: true,
      latestRecordTime: null,
      staleAfterMinutes: STATS_STALE_AFTER_MINUTES,
      syncEndpoint: '/api/analytics/sync',
      jobName: 'syncArticleStats',
      error: error instanceof Error ? error.message : '统计状态读取失败',
    };
  }
}

export async function GET() {
  const [database, analyticsSync, jobRuns] = await Promise.all([
    getDatabaseStatus(),
    getAnalyticsSyncStatus(),
    getRecentJobRuns(),
  ]);

  const capabilities = getSystemCapabilities();
  const capabilitySummary = summarizeCapabilities();
  const dataSources = getDataSourceContracts();
  const dataSourceSummary = summarizeDataSources();
  const jobs = listJobs();

  const warnings = [
    ...capabilities
      .filter(capability => capability.status !== 'ready')
      .map(capability => `${capability.name}: ${capability.blockers.join('；') || capability.nextAction}`),
    ...(process.env.INTERNAL_WORKER_TOKEN ? [] : ['未配置 INTERNAL_WORKER_TOKEN，外部 worker 不能调用 /api/jobs。']),
  ];

  const status = database.status === 'error'
    ? 'error'
    : capabilitySummary.blocked > 0 || analyticsSync.status !== 'ok'
      ? 'warning'
      : 'ok';

  return NextResponse.json({
    success: status !== 'error',
    status,
    checkedAt: new Date().toISOString(),
    database,
    capabilities,
    capabilitySummary,
    dataSources,
    dataSourceSummary,
    jobs,
    jobRuns,
    analyticsSync,
    security: {
      demoDataAllowed: process.env.ALLOW_DEMO_DATA === 'true',
      workerTokenConfigured: !!process.env.INTERNAL_WORKER_TOKEN,
      authCookieSecretConfigured: !!process.env.AUTH_COOKIE_SECRET,
      passwordHashSaltConfigured: !!process.env.PASSWORD_HASH_SALT,
    },
    warnings,
  }, { status: status === 'error' ? 500 : 200 });
}
