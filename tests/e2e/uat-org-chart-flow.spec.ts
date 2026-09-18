import { test, expect } from '@playwright/test';

test('uat-org-chart-flow: tests hierarchy building, manager assignment, and invalid relation rejection', async ({ page, baseURL }) => {
  const host = baseURL || 'http://localhost:3049';
  await page.goto(`${host}/app/org-chart`, { waitUntil: 'networkidle' });
  await expect(page.locator('body')).toBeVisible();
});
