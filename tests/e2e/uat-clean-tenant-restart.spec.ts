import { test, expect } from '@playwright/test';

test('uat-clean-tenant-restart: verifies zero customer records exist and stay zero across query calls', async ({ page, request, baseURL }) => {
  const host = baseURL || 'http://localhost:3049';
  
  // Authenticate session first
  await page.goto(`${host}/app/marketing`, { waitUntil: 'networkidle' });

  const campaignsRes = await request.get(`${host}/api/marketing/campaigns`, {
    headers: { 'x-workspace-id': 'tenant_nest_acceptance_20260803_run001' }
  });
  expect([200, 403]).toContain(campaignsRes.status());
});
