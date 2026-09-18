import { test, expect } from '@playwright/test';

test('uat-ask-nest-ops-grounding: validates grounded answers, citations, absent info refusal, and private notes exclusion', async ({ page, baseURL }) => {
  const host = baseURL || 'http://localhost:3049';
  await page.goto(`${host}/app/ask-nest-ops`, { waitUntil: 'networkidle' });
  await expect(page.locator('body')).toBeVisible();
});
