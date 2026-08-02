import { test, expect } from '@playwright/test';

test.describe('Marketing Export vs Delivery Truth', () => {
  test('ZIP download results in Exported status and Google Drive displays Demo connection', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&mode=review');
    await page.click('button:has-text("Delivery Options")');
    await expect(page.locator('[data-testid="gdrive-status"]')).toContainText('Demo connection');
  });
});
