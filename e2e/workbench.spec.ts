import { test, expect } from '@playwright/test';
import { mockAuthenticatedApp } from './support/auth';

test.beforeEach(async ({ page }) => {
  await mockAuthenticatedApp(page);
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
