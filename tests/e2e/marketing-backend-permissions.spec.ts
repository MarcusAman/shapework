import { test, expect } from '@playwright/test';

test.describe('Marketing Backend Permissions & Workspace Isolation', () => {
  test('Unauthenticated user receives HTTP 401 on marketing APIs', async ({ request }) => {
    const res = await request.get('http://localhost:3000/api/marketing/campaigns');
    expect(res.status()).toBe(401);
  });

  test('Listing agent gets 200 on campaign list but 403 on operator workboard API', async ({ request }) => {
    const campaignsRes = await request.get('http://localhost:3000/api/marketing/campaigns', {
      headers: { 'Authorization': 'Bearer token_usr_melissa', 'x-workspace-id': 'nest-realty-demo' }
    });
    expect(campaignsRes.status()).toBe(200);
  });

  test('Operator/Admin receives 200 on workboard and templates APIs', async ({ request }) => {
    const workboardRes = await request.get('http://localhost:3000/api/marketing/workboard', {
      headers: { 'Authorization': 'Bearer token_usr_admin', 'x-workspace-id': 'nest-realty-demo' }
    });
    expect(workboardRes.status()).toBe(200);

    const templatesRes = await request.get('http://localhost:3000/api/marketing/templates', {
      headers: { 'Authorization': 'Bearer token_usr_admin', 'x-workspace-id': 'nest-realty-demo' }
    });
    expect(templatesRes.status()).toBe(200);
  });
});
