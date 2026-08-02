import { test, expect } from '@playwright/test';

test.describe('Marketing State Consistency', () => {
  test('derived campaign state prevents contradictory status text combinations', async ({ page }) => {
    await page.goto('http://localhost:3000/app/marketing?campaign=campaign_990_inspiration&mode=review');

    // Header displays authoritative status badge
    const badge = page.locator('header span:has-text("Ready to Prepare"), header span:has-text("Ready for Review"), header span:has-text("Package Approved")').first();
    await expect(badge).toBeVisible({ timeout: 10000 });

    // Assert zero contradictory status strings exist in header
    const headerText = await page.locator('header').first().innerText();
    expect(headerText).not.toContain('Approved & Ready for Delivery (0 of 5 Ready)');
    expect(headerText).not.toContain('0 of 5 Ready Package Approved');
  });
});
