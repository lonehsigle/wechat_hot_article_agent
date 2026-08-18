import { test, expect } from '@playwright/test';
import { mockAuthenticatedApp } from './support/auth';

test.beforeEach(async ({ page }) => {
  await mockAuthenticatedApp(page);
});

test.describe('Navigation', () => {
  test('switches between main tabs via sidebar', async ({ page }) => {
    await page.goto('/app');

    await page.getByRole('button', { name: /热门选题/ }).click();
    await expect(page.locator('text=热门选题').first()).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/nav-hot-topics.png' });

    await page.getByRole('button', { name: /文章采集/ }).click();
    await expect(page.locator('text=文章采集').first()).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/nav-wechat-collect.png' });

    await page.getByRole('button', { name: /选题分析/ }).click();
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
