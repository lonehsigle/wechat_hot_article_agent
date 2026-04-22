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

async function login(page: any) {
  await page.route('/api/auth', (route: any) =>
    route.fulfill({ status: 200, body: JSON.stringify(AUTH_RESPONSE) })
  );
}

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
    await login(page);
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
    await page.waitForURL('**/');
    await expect(page.locator('text=热点聚合')).toBeVisible();
  });
});
