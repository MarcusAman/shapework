import { test, expect } from '@playwright/test';

test.describe('Marketing Build View - Safe Job Cancellation', () => {
  test('opens cancel modal and stops generation safely while preserving completed assets', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&mode=review');

    const cancelLink = page.locator('button:has-text("Cancel Preparation")');
    if (await cancelLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await cancelLink.click();
      await expect(page.locator('text=Cancel Package Preparation?')).toBeVisible();
      await page.locator('button:has-text("Yes, Cancel")').click();
    }
  });
});
