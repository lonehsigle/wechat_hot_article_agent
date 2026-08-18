import { test, expect } from '@playwright/test';
import { AUTH_RESPONSE, authenticatePage } from './support/auth';

test.describe('Auth Flow', () => {
  test('landing page shows features for unauthenticated user', async ({ page }) => {
    await page.route('/api/auth', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify({ authenticated: false }) })
    );
    await page.goto('/');
    await expect(page).toHaveTitle(/内容监控中心/);
    await expect(page.locator('text=热点聚合')).toBeVisible();
    await expect(page.locator('text=集热点监控')).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/landing-page.png' });
  });

  test('redirects to app after login', async ({ page }) => {
    await authenticatePage(page);
    await page.route('/api/auth', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(AUTH_RESPONSE) })
    );
    await page.goto('/');
    await page.waitForURL('**/app');
    await expect(page.locator('aside h1').first()).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/logged-in-app.png' });
  });

  test('app page requires auth and redirects when unauthenticated', async ({ page }) => {
    await page.route('/api/auth', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify({ authenticated: false }) })
    );
    await page.goto('/app');
    await expect(page).toHaveURL(url => url.pathname === '/');
    await expect(page.locator('text=热点聚合')).toBeVisible();
  });
});
