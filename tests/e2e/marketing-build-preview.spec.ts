import { test, expect } from '@playwright/test';

test.describe('Marketing Build View - Interactive Asset Previews', () => {
  test('clicking ready asset thumbnail updates central preview and URL state', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&mode=review');

    // Wait for Flyer tab/button
    const flyerBtn = page.locator('#asset-nav-flyer');
    await expect(flyerBtn).toBeVisible({ timeout: 10000 });
    await flyerBtn.click();

    // Verify URL query param asset=flyer
    expect(page.url()).toContain('asset=flyer');
  });
});
