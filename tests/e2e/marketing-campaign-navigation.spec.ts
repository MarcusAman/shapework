import { test, expect } from '@playwright/test';

test.describe('Marketing Campaign Navigation & Deep Linking', () => {
  test('root /app/marketing shows campaign selection list', async ({ page }) => {
    await page.goto('/app/marketing');
    await page.waitForLoadState('networkidle');

    // Verify campaign cards are present
    await expect(page.locator('h3:has-text("990 Inspiration Drive")')).toBeVisible();
    await expect(page.locator('h3:has-text("304 Ocean Blvd")')).toBeVisible();
    await expect(page.locator('h3:has-text("212 Wetland Court")')).toBeVisible();

    // Verify workspace layout is NOT rendered
    await expect(page.locator('text=← Back to Marketing Campaigns')).not.toBeVisible();
  });

  test('selecting a campaign opens dedicated workspace and syncs URL', async ({ page }) => {
    await page.goto('/app/marketing');
    await page.waitForLoadState('networkidle');

    // Click Review Package on 990 Inspiration Drive
    const reviewBtn = page.locator('button:has-text("Review Package")').first();
    await reviewBtn.click();

    // Verify dedicated workspace header and back button are visible
    await expect(page.locator('button:has-text("← Back to Marketing Campaigns")')).toBeVisible();

    // Verify URL reflects campaign selection
    await expect(page).toHaveURL(/.*campaign=campaign_990_inspiration.*/);
  });

  test('clicking Back to Marketing returns to campaign list view', async ({ page }) => {
    await page.goto('/app/marketing?campaign=campaign_990_inspiration&mode=review&asset=flyer');
    await page.waitForLoadState('networkidle');

    // Verify in workspace
    await expect(page.locator('button:has-text("← Back to Marketing Campaigns")')).toBeVisible();

    // Click Back
    await page.click('button:has-text("← Back to Marketing Campaigns")');

    // Verify back on campaign list
    await expect(page.locator('h3:has-text("990 Inspiration Drive")')).toBeVisible();
    await expect(page.locator('button:has-text("← Back to Marketing Campaigns")')).not.toBeVisible();
  });

  test('browser back button restores previous navigation state', async ({ page }) => {
    await page.goto('/app/marketing');
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("Review Package")');
    await expect(page.locator('button:has-text("← Back to Marketing Campaigns")')).toBeVisible();

    await page.goBack();
    await expect(page.locator('h3:has-text("990 Inspiration Drive")')).toBeVisible();
  });
});
