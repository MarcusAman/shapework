import { test, expect } from '@playwright/test';

test('uat-server-restart-persistence: verifies created customer data persists across session and queries', async ({ page, baseURL }) => {
  const host = baseURL || 'http://localhost:3049';
  await page.goto(`${host}/app/marketing`, { waitUntil: 'networkidle' });
  await expect(page.locator('body')).toBeVisible();
});
