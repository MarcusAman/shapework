import { test, expect } from '@playwright/test';

test.describe('Marketing Print Workflow', () => {
  test('displays print specifications and physical delivery lifecycle controls', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&mode=work');
    await expect(page.locator('text=Physical Print & Vendor Price Quote')).toBeVisible();
    await expect(page.locator('text=36" x 24"')).toBeVisible();
    await expect(page.locator('button:has-text("Mark Physically Delivered")')).toBeVisible();
  });
});
