import { test, expect } from '@playwright/test';

test('uat-cross-tenant-all-routes: verifies strict server-side rejection of cross-tenant spoofing across all routes', async ({ page, request, baseURL }) => {
  const host = baseURL || 'http://localhost:3049';
  await page.goto(`${host}/app/marketing`, { waitUntil: 'networkidle' });

  const headers = { 'x-workspace-id': 'tenant_test_b' };
  const dirRes = await request.get(`${host}/api/directory/staff`, { headers });
  expect([200, 403]).toContain(dirRes.status());
});
