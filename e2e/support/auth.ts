import { createHmac } from 'node:crypto';
import type { Page } from '@playwright/test';

export const E2E_AUTH_SECRET = 'content-monitor-e2e-auth-secret';

export const AUTH_RESPONSE = {
  authenticated: true,
  user: {
    id: 1,
    username: 'e2euser',
    email: 'e2e@test.com',
    displayName: 'E2E User',
    role: 'admin',
  },
};

export async function authenticatePage(page: Page): Promise<void> {
  const token = 'e2e';
  const signature = createHmac('sha256', E2E_AUTH_SECRET).update(token).digest('base64url');

  await page.context().addCookies([
    { name: 'auth_token', value: token, url: 'http://localhost:3000', httpOnly: true, sameSite: 'Lax' },
    { name: 'auth_sig', value: `v1.${signature}`, url: 'http://localhost:3000', httpOnly: true, sameSite: 'Lax' },
  ]);
}

export async function mockAuthenticatedApp(page: Page): Promise<void> {
  await authenticatePage(page);
  await page.route('/api/auth', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(AUTH_RESPONSE) })
  );
  await page.route('/api/dashboard', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ totalArticles: 0, publishedArticles: 0, drafts: 0, analysisTasks: 0 }) })
  );
  await page.route('/api/ops/status', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, status: 'ok', capabilitySummary: { ready: 0, degraded: 0, blocked: 0 }, warnings: [] }) })
  );
  await page.route('/api/published-articles', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [] }) })
  );
  await page.route('/api/analysis', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
  );
  await page.route('/api/app-settings**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, value: null }) })
  );
  await page.route('/api/llm-config', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { provider: 'minimax', model: 'MiniMax-M2.7', hasApiKey: false } }) })
  );
  await page.route('/api/wechat-accounts', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, accounts: [] }) })
  );
  await page.route('/api/styles', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, styles: [] }) })
  );
}
