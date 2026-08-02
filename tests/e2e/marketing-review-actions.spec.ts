import { test, expect } from '@playwright/test';

test.describe('Marketing Review Actions & Disclosures', () => {
  test('single asset approval gives immediate feedback', async ({ page }) => {
    await page.goto('/app/marketing?campaign=campaign_990_inspiration&mode=review&asset=flyer');
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("Approve Asset")');
    await expect(page.locator('text=approved successfully')).toBeVisible();
  });

  test('regenerate package opens confirmation modal before executing', async ({ page }) => {
    await page.goto('/app/marketing?campaign=campaign_990_inspiration&mode=review&asset=flyer');
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("More → Regenerate Package")');
    await expect(page.locator('text=Regenerate Full Package?')).toBeVisible();

    await page.click('button:has-text("Cancel")');
    await expect(page.locator('text=Regenerate Full Package?')).not.toBeVisible();
  });
});
