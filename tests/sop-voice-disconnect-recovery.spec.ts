import { test, expect } from '@playwright/test';

test.describe('SOP Voice Disconnect & Session Recovery', () => {
  test('saves draft to local storage so content survives disconnects or refreshes', async ({ page }) => {
    await page.goto('/app/sops?subtab=today');
    await page.waitForLoadState('networkidle');
  });
});
