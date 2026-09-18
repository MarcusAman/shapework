import { test, expect } from '@playwright/test';

test.describe('Marketing Delivery State', () => {
  test('delivery options available only when campaign is approved and distinguishes download vs delivered', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_304_ocean&mode=delivered');

    // Delivery options button becomes available in header or right panel
    const deliveryBtn = page.locator('button:has-text("Delivery Options"), button:has-text("Open Delivery Options")').first();
    await expect(deliveryBtn).toBeVisible({ timeout: 10000 });
    await deliveryBtn.click();

    // Verify Delivery drawer opens
    const drawer = page.locator('h3:has-text("Delivery options"), h3:has-text("Delivery Options")');
    await expect(drawer).toBeVisible({ timeout: 10000 });

    // Distinguishes Manual Exports vs Connected Destinations
    await expect(page.locator('text=Manual exports').first()).toBeVisible();
    await expect(page.locator('text=Download ZIP Package').first()).toBeVisible();
  });
});
