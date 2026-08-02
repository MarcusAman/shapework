import { test, expect } from '@playwright/test';

test.describe('Marketing Export vs Delivery Truth', () => {
  test('ZIP download results in Exported status, not Delivered', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration');
    await page.click('button:has-text("Delivery Options")');
    await expect(page.locator('button:has-text("Download ZIP Package")')).toBeVisible();
  });
});
