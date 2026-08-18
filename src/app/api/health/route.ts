import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { llmConfigs, wechatAccounts } from '@/lib/db/schema';
import { summarizeCapabilities } from '@/lib/system/capabilities';
import { summarizeDataSources } from '@/lib/system/data-sources';

type CheckStatus = 'ok' | 'warning' | 'error';

interface Check {
  name: string;
  status: CheckStatus;
  message: string;
}

function checkEnv(name: string, requiredInProduction = true): Check {
  const hasValue = !!process.env[name];
  if (hasValue) {
    return { name, status: 'ok', message: '已配置' };
  }
  const isRequired = requiredInProduction && process.env.NODE_ENV === 'production';
  return {
    name,
    status: isRequired ? 'error' : 'warning',
    message: isRequired ? '生产环境必须配置' : '未配置，部分功能可能不可用',
  };
}

export async function GET() {
  const checks: Check[] = [
    checkEnv('DATABASE_URL'),
    checkEnv('DB_ENCRYPTION_KEY'),
    checkEnv('AUTH_COOKIE_SECRET', false),
    checkEnv('PASSWORD_HASH_SALT'),
  ];

  try {
    await db().execute('select 1');
    checks.push({ name: 'database_connection', status: 'ok', message: '数据库连接正常' });
  } catch (error) {
    checks.push({
      name: 'database_connection',
      status: 'error',
      message: error instanceof Error ? error.message : '数据库连接失败',
    });
  }

  try {
    const llmConfig = await db().select().from(llmConfigs).limit(1);
    checks.push({
      name: 'llm_config',
      status: llmConfig.length > 0 ? 'ok' : 'warning',
      message: llmConfig.length > 0 ? '已配置 LLM' : '未配置 LLM，AI 创作不可用',
    });
  } catch (error) {
    checks.push({
      name: 'llm_config',
      status: 'error',
      message: error instanceof Error ? error.message : '读取 LLM 配置失败',
    });
  }

  try {
    const accounts = await db().select().from(wechatAccounts).limit(1);
    checks.push({
      name: 'wechat_account',
      status: accounts.length > 0 ? 'ok' : 'warning',
      message: accounts.length > 0 ? '已配置公众号账号' : '未配置公众号账号，发布不可用',
    });
  } catch (error) {
    checks.push({
      name: 'wechat_account',
      status: 'error',
      message: error instanceof Error ? error.message : '读取公众号账号失败',
    });
  }

  checks.push({
    name: 'demo_data',
    status: process.env.ALLOW_DEMO_DATA === 'true' ? 'warning' : 'ok',
    message: process.env.ALLOW_DEMO_DATA === 'true'
      ? '演示数据已开启，不建议用于生产'
      : '演示数据默认禁用',
  });

  checks.push({
    name: 'internal_worker_token',
    status: process.env.INTERNAL_WORKER_TOKEN ? 'ok' : 'warning',
    message: process.env.INTERNAL_WORKER_TOKEN
      ? '已配置外部 worker 调用 token'
      : '未配置外部 worker token，长任务/定时任务只能手动触发',
  });

  const status: CheckStatus = checks.some(check => check.status === 'error')
    ? 'error'
    : checks.some(check => check.status === 'warning')
      ? 'warning'
      : 'ok';

  return NextResponse.json({
    success: status !== 'error',
    status,
    checks,
    capabilities: summarizeCapabilities(),
    dataSources: summarizeDataSources(),
  }, { status: status === 'error' ? 500 : 200 });
}
