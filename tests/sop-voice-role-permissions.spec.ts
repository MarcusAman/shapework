import { test, expect } from '@playwright/test';

test.describe('SOP Voice Tenant & Role Permissions', () => {
  test('enforces tenant boundary on SOP endpoints', async ({ request }) => {
    const res = await request.get('/api/sops/drafts?workspaceId=nest-realty-wilmington');
    expect([401, 403]).toContain(res.status());
  });
});
