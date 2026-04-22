import { test, expect } from '@playwright/test';

const AUTH_RESPONSE = {
  authenticated: true,
  user: {
    id: 1,
    username: 'e2euser',
    email: 'e2e@test.com',
    displayName: 'E2E User',
    role: 'admin',
  },
};

test.beforeEach(async ({ page }) => {
  await page.route('/api/auth', (route) =>
    route.fulfill({ status: 200, body: JSON.stringify(AUTH_RESPONSE) })
  );
  await page.route('/api/published-articles', (route) =>
    route.fulfill({ status: 200, body: JSON.stringify({ success: true, data: [] }) })
  );
  await page.route('/api/analysis', (route) =>
    route.fulfill({ status: 200, body: JSON.stringify([]) })
  );
  await page.route('/api/app-settings**', (route) =>
    route.fulfill({ status: 200, body: JSON.stringify({ success: true, value: null }) })
  );
  await page.route('/api/llm-config', (route) =>
    route.fulfill({ status: 200, body: JSON.stringify({ success: true, data: { provider: 'minimax', model: 'MiniMax-M2.7', hasApiKey: false } }) })
  );
  await page.route('/api/wechat-accounts', (route) =>
    route.fulfill({ status: 200, body: JSON.stringify({ success: true, accounts: [] }) })
  );
});

test.describe('Dashboard', () => {
  test('loads dashboard with sidebar and stats', async ({ page }) => {
    await page.goto('/app');
    await expect(page.locator('text=首页').first()).toBeVisible();
    await expect(page.locator('text=欢迎使用内容工作台')).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/dashboard.png' });
  });

  test('sidebar shows user info', async ({ page }) => {
    await page.goto('/app');
    await expect(page.locator('text=E2E User')).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/dashboard-user.png' });
  });
});
