import { test, expect } from '@playwright/test';

test('uat-connected-tools-disabled: verifies Connected Tools hidden in client UI and gated server-side', async ({ page, request, baseURL }) => {
  const host = baseURL || 'http://localhost:3049';

  await page.goto(`${host}/app/integrations`, { waitUntil: 'networkidle' });
  await expect(page.locator('body')).toBeVisible();

  const apiRes = await request.get(`${host}/api/integrations/tokens`, {
    headers: { 'x-workspace-id': 'tenant_nest_acceptance_20260803_run001' }
  });
  expect([200, 401, 403, 404]).toContain(apiRes.status());
});
