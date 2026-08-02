import { test, expect } from '@playwright/test';

test.describe('Marketing Connected Destination Truth', () => {
  test('Google Drive displays Demo connection and not unverified Connected Active label', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration');
    await page.click('button:has-text("Delivery Options")');
    await expect(page.locator('[data-testid="gdrive-status"]')).toHaveText('Demo connection');
    await expect(page.locator('body')).not.toContainText('Connected • Active');
  });
});
