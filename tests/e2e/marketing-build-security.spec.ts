import { test, expect } from '@playwright/test';

test.describe('Marketing Build View - Security & Access Control', () => {
  test('rejects unauthenticated access to SSE stream and generation endpoints', async ({ request }) => {
    const res = await request.get('http://localhost:3049/api/marketing/campaigns/campaign_990_inspiration/generation-jobs/job_test/events');
    expect(res.status()).toBe(401);
  });
});
