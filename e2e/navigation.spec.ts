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

test.describe('Navigation', () => {
  test('switches between main tabs via sidebar', async ({ page }) => {
    await page.goto('/app');

    await page.locator('text=热门选题').click();
    await expect(page.locator('text=热门选题').first()).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/nav-hot-topics.png' });

    await page.locator('text=文章采集').click();
    await expect(page.locator('text=文章采集').first()).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/nav-wechat-collect.png' });

    await page.locator('text=选题分析').click();
    await expect(page.locator('text=选题分析').first()).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/nav-topic-analysis.png' });
  });

  test('collapses and expands sidebar', async ({ page }) => {
    await page.goto('/app');
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeVisible();
    const collapseBtn = page.locator('aside button').first();
    await collapseBtn.click({ force: true });
    await page.screenshot({ path: 'e2e/screenshots/sidebar-collapsed.png' });
    const expandBtn = page.locator('aside button').first();
    await expandBtn.click({ force: true });
    await expect(page.locator('text=内容工作台').first()).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/sidebar-expanded.png' });
  });
});
