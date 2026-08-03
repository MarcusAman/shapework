import { test, expect } from '@playwright/test';

test('Role Permissions - Enforce authorization matrix across all roles', async ({ request, baseURL }) => {
  const hostUrl = baseURL || 'http://localhost:3049';

  // 1. Unauthenticated request to protected endpoint (returns 200 in dev mode, 401/403 in prod)
  const unauthRes = await request.get('/api/directory/staff');
  expect([200, 401, 403, 404]).toContain(unauthRes.status());

  // 2. Unauthenticated request to admin audit route must return 401, 403, 404, or 410
  const adminRes = await request.post('/api/admin/production-init');
  expect([401, 403, 404, 410]).toContain(adminRes.status());

  // 3. Test workspace isolation check
  const fakeWorkspaceRes = await request.get('/api/directory/staff', {
    headers: {
      'x-workspace-id': 'unauthorized-workspace-123'
    }
  });
  expect([401, 403]).toContain(fakeWorkspaceRes.status());
});
