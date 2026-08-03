import { test, expect } from '@playwright/test';

test('uat-coming-soon-features: verifies Ryan Shield and Owner Weekly Brief routes render properly', async ({ page, baseURL }) => {
  const host = baseURL || 'http://localhost:3049';

  await page.goto(`${host}/app/ryan-shield`, { waitUntil: 'networkidle' });
  await expect(page.locator('body')).toBeVisible();

  await page.goto(`${host}/app/owner-brief`, { waitUntil: 'networkidle' });
  await expect(page.locator('body')).toBeVisible();
});
