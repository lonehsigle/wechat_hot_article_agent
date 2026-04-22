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
  await page.route('/api/styles', (route) =>
    route.fulfill({ status: 200, body: JSON.stringify({ success: true, styles: [] }) })
  );
});

test.describe('Workbench', () => {
  test('navigates to create workbench and shows input step', async ({ page }) => {
    await page.goto('/app');
    await page.getByRole('button', { name: /创作工作台/ }).click();
    await expect(page.locator('text=输入关键词搜索热点')).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/workbench-input.png' });
  });

  test('can enter keyword and trigger search', async ({ page }) => {
    await page.goto('/app');
    await page.getByRole('button', { name: /创作工作台/ }).click();
    const input = page.locator('input').first();
    await input.fill('AI写作');
    await page.screenshot({ path: 'e2e/screenshots/workbench-keyword.png' });
  });
});
