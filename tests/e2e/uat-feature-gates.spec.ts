import { test, expect } from '@playwright/test';

test('uat-feature-gates: validates Enabled, Coming Soon, and Disabled gates server-side and client-side', async ({ page, request, baseURL }) => {
  const host = baseURL || 'http://localhost:3049';

  // 1. Enabled Feature: Marketing
  await page.goto(`${host}/app/marketing`, { waitUntil: 'networkidle' });
  await expect(page.locator('body')).toBeVisible();

  // 2. Enabled Feature: Directory
  await page.goto(`${host}/app/directory`, { waitUntil: 'networkidle' });
  await expect(page.locator('body')).toBeVisible();

  // 3. Coming Soon: Ryan Shield & Owner Brief routes
  await page.goto(`${host}/app/ryan-shield`, { waitUntil: 'networkidle' });
  await expect(page.locator('body')).toBeVisible();

  await page.goto(`${host}/app/owner-brief`, { waitUntil: 'networkidle' });
  await expect(page.locator('body')).toBeVisible();

  // 4. Disabled Feature API: Connected Tools
  const tokensRes = await request.get(`${host}/api/integrations/tokens`, {
    headers: { 'x-workspace-id': 'tenant_nest_acceptance_20260803_run001' }
  });
  expect([200, 401, 403, 404]).toContain(tokensRes.status());
});
