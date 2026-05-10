import { db } from '@/lib/db';
import { wechatAccounts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAccessToken } from './service';

export type WechatCapabilityStatus = 'ready' | 'degraded' | 'blocked';

export interface WechatCapabilityCheck {
  status: WechatCapabilityStatus;
  message: string;
  evidence?: string;
}

export interface WechatAccountCapabilityReport {
  account: { id: number; name: string };
  summary: { status: WechatCapabilityStatus; ready: number; degraded: number; blocked: number };
  checks: {
    credentials: WechatCapabilityCheck;
    accessToken: WechatCapabilityCheck;
    draft: WechatCapabilityCheck;
    publish: WechatCapabilityCheck;
    datacube: WechatCapabilityCheck;
  };
}

function summarize(checks: WechatAccountCapabilityReport['checks']) {
  const values = Object.values(checks);
  const blocked = values.filter(check => check.status === 'blocked').length;
  const degraded = values.filter(check => check.status === 'degraded').length;
  const ready = values.filter(check => check.status === 'ready').length;
  return {
    status: blocked > 0 ? 'blocked' as const : degraded > 0 ? 'degraded' as const : 'ready' as const,
    ready,
    degraded,
    blocked,
  };
}

async function postWechatJson(accessToken: string, path: string, body: Record<string, unknown>) {
  const response = await fetch(`https://api.weixin.qq.com${path}?access_token=${accessToken}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return response.json();
}

function checkApiResult(data: Record<string, any>, readyMessage: string, evidence: string): WechatCapabilityCheck {
  if (data.errcode) {
    return {
      status: 'blocked',
      message: `${data.errmsg || '微信接口返回错误'} (${data.errcode})`,
      evidence,
    };
  }
  return { status: 'ready', message: readyMessage, evidence };
}

export async function inspectWechatAccountCapabilities(
  accountId: number,
  options?: { live?: boolean }
): Promise<WechatAccountCapabilityReport | null> {
  const accounts = await db().select().from(wechatAccounts).where(eq(wechatAccounts.id, accountId));
  const account = accounts[0];
  if (!account) return null;

  const checks: WechatAccountCapabilityReport['checks'] = {
    credentials: account.appId && account.appSecret
      ? { status: 'ready', message: '已配置 appId/appSecret。' }
      : { status: 'blocked', message: '缺少 appId 或 appSecret。' },
    accessToken: { status: 'blocked', message: '尚未检查 access_token。' },
    draft: { status: 'degraded', message: '未进行实时草稿权限探测。' },
    publish: { status: 'degraded', message: '未进行实时发布权限探测；2025 年 7 月起部分主体账号发布接口可能被回收。' },
    datacube: { status: 'degraded', message: '未进行实时 datacube 权限探测。' },
  };

  if (!account.appId || !account.appSecret) {
    checks.accessToken = { status: 'blocked', message: '缺少账号凭据，无法获取 access_token。' };
    checks.draft = { status: 'blocked', message: '缺少账号凭据，无法探测草稿权限。' };
    checks.publish = { status: 'blocked', message: '缺少账号凭据，无法探测发布权限。' };
    checks.datacube = { status: 'blocked', message: '缺少账号凭据，无法探测统计权限。' };
  } else if (options?.live) {
    try {
      const token = await getAccessToken(accountId);
      checks.accessToken = { status: 'ready', message: 'access_token 获取成功。' };
      const today = new Date().toISOString().slice(0, 10);
      const [draft, publish, datacube] = await Promise.all([
        postWechatJson(token, '/cgi-bin/draft/batchget', { offset: 0, count: 1, no_content: 1 }),
        postWechatJson(token, '/cgi-bin/freepublish/batchget', { offset: 0, count: 1, no_content: 1 }),
        postWechatJson(token, '/datacube/getarticlesummary', { begin_date: today, end_date: today }),
      ]);
      checks.draft = checkApiResult(draft, '草稿列表权限可用。', '/cgi-bin/draft/batchget');
      checks.publish = checkApiResult(publish, '发布列表权限可用。', '/cgi-bin/freepublish/batchget');
      checks.datacube = checkApiResult(datacube, '图文统计权限可用；无数据不等于无权限。', '/datacube/getarticlesummary');
    } catch (error) {
      checks.accessToken = {
        status: 'blocked',
        message: error instanceof Error ? error.message : String(error),
      };
      checks.draft = { status: 'blocked', message: 'access_token 探测失败，未继续调用草稿接口。' };
      checks.publish = { status: 'blocked', message: 'access_token 探测失败，未继续调用发布接口。' };
      checks.datacube = { status: 'blocked', message: 'access_token 探测失败，未继续调用统计接口。' };
    }
  } else {
    checks.accessToken = account.accessToken && account.tokenExpiresAt && account.tokenExpiresAt.getTime() > Date.now()
      ? { status: 'ready', message: '存在未过期 access_token 缓存。' }
      : { status: 'degraded', message: '账号已配置，但未实时验证 access_token。' };
  }

  return {
    account: { id: account.id, name: account.name },
    summary: summarize(checks),
    checks,
  };
}
