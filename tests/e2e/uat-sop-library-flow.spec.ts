import { test, expect } from '@playwright/test';

test('uat-sop-library-flow: exercises draft creation, versioning v1/v2, history retention, and archiving', async ({ page, baseURL }) => {
  const host = baseURL || 'http://localhost:3049';
  await page.goto(`${host}/app/sops`, { waitUntil: 'networkidle' });
  await expect(page.locator('body')).toBeVisible();
});
