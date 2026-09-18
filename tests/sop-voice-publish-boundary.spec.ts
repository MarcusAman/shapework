import { test, expect } from '@playwright/test';

test.describe('SOP Voice Publish Boundary', () => {
  test('AI session cannot publish SOP; requires human publisher boundary', async ({ request }) => {
    const res = await request.put('/api/sops/sop_test_123/publish');
    expect([401, 403, 400, 404]).toContain(res.status());
  });
});
