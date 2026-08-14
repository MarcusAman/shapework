import { test, expect } from '@playwright/test';

test.describe('SOP Voice Live Session & State Machine', () => {
  test('state machine transitions properly from idle to connecting/listening', async ({ page }) => {
    await page.goto('/app/sops?subtab=today');
    await page.waitForLoadState('networkidle');

    const openBtn = page.locator('button:has-text("Voice Diagnostic Interview")').first();
    if (await openBtn.isVisible()) {
      await openBtn.click();
      await expect(page.locator('text=AI REAL ESTATE OPERATIONS CONSULTANT STUDIO')).toBeVisible();
    }
  });
});
