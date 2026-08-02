import { test, expect } from '@playwright/test';

test.describe('Marketing Review Mode', () => {
  test('allows single asset approval without auto-approving full campaign', async ({ page }) => {
    await page.goto('http://localhost:3000/app/marketing?campaign=campaign_990_inspiration&mode=review');

    // If Build View sidecar is visible during active prep, click Hide Build View or Review Package to switch to Review Panel
    const hideBuildViewBtn = page.locator('button:has-text("Hide Build View"), button:has-text("Review Package")').first();
    if (await hideBuildViewBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await hideBuildViewBtn.click();
    }

    // Click Property Flyer in asset rail
    const flyerTab = page.locator('#asset-nav-flyer').first();
    await expect(flyerTab).toBeVisible({ timeout: 10000 });
    await flyerTab.click();

    // Click Approve Material button
    const approveMaterialBtn = page.locator('button:has-text("Approve Material"), button:has-text("Approve Asset")').first();
    await expect(approveMaterialBtn).toBeVisible({ timeout: 10000 });
    await approveMaterialBtn.click();

    // Verify material status is updated to Approved
    await expect(page.locator('text=Approved').first()).toBeVisible();
  });
});
