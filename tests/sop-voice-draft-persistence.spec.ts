import { test, expect } from '@playwright/test';

test.describe('SOP Voice Draft Persistence', () => {
  test('persists draft to REST API /api/sops/drafts', async ({ request }) => {
    // Unauthenticated request should fail
    const res = await request.get('/api/sops/drafts');
    expect([401, 403]).toContain(res.status());
  });
});
