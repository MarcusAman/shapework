import { test, expect } from '@playwright/test';

test.describe('SOP Voice Auth Security', () => {
  test('rejects unsigned/unauthenticated requests for signed-url', async ({ request }) => {
    const res = await request.get('/api/elevenlabs/signed-url');
    // Expect 401 Unauthorized or 403 Forbidden without credentials/session
    expect([401, 403]).toContain(res.status());
  });

  test('does not leak VITE_ELEVENLABS_API_KEY in client window environment', async ({ page }) => {
    await page.goto('/app/sops?subtab=today');
    const leakedKey = await page.evaluate(() => {
      return (window as any).import?.meta?.env?.VITE_ELEVENLABS_API_KEY || (process.env as any)?.VITE_ELEVENLABS_API_KEY;
    });
    expect(leakedKey).toBeUndefined();
  });
});
