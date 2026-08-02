import { test, expect } from '@playwright/test';

test.describe('Marketing Review Desktop & Mobile Responsive Layout', () => {
  test('1440x900 viewport displays 3-area desktop layout above the fold', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/app/marketing?campaign=campaign_990_inspiration&mode=review&asset=flyer');
    await page.waitForLoadState('networkidle');

    // Left Rail Deliverables list
    const leftRail = page.locator('button:has-text("Property Flyer")').first();
    await expect(leftRail).toBeVisible();

    // Center Canvas
    const centerCanvas = page.locator('text=Property Flyer Proof');
    await expect(centerCanvas).toBeVisible();

    // Right Rail Actions
    const rightRailAction = page.locator('button:has-text("Approve Asset")');
    await expect(rightRailAction).toBeVisible();
  });
});
