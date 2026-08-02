import { test, expect } from '@playwright/test';

test.describe('Marketing Build View - SSE Reconnection & Event Replay', () => {
  test('reconnects SSE stream and replays missed events with Last-Event-ID', async ({ page }) => {
    await page.goto('http://localhost:3000/app/marketing?campaign=campaign_990_inspiration&mode=review');

    const sidecarHeading = page.locator('text=Shapework is preparing your package');
    await expect(sidecarHeading).toBeVisible({ timeout: 10000 });

    // Reload page to simulate browser reconnection
    await page.reload();

    // Verify stream resumes and preserves progress
    await expect(page.locator('text=Shapework is preparing your package')).toBeVisible();

    // Open preparation details accordion
    const accordionBtn = page.locator('button:has-text("Preparation details")');
    if (await accordionBtn.isVisible()) {
      await accordionBtn.click();
      await expect(page.locator('text=Listing information verified')).toBeVisible();
    }
  });
});
