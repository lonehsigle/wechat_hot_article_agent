import { test, expect } from '@playwright/test';
import { mockAuthenticatedApp } from './support/auth';

test.beforeEach(async ({ page }) => {
  await mockAuthenticatedApp(page);
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
