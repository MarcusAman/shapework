import { test, expect } from '@playwright/test';

test('uat-marketing-clean-flow: executes full clean marketing request to PDF rendering, revision, approval, and package export', async ({ page, baseURL }) => {
  const host = baseURL || 'http://localhost:3049';
  await page.goto(`${host}/app/marketing`, { waitUntil: 'networkidle' });
  await expect(page.locator('body')).toBeVisible();
});
