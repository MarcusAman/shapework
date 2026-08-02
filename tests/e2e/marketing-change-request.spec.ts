import { test, expect } from '@playwright/test';

test.describe('Marketing Change Request Drawer', () => {
  test('defaults scope to single material only and presents affected materials list', async ({ page }) => {
    await page.goto('http://localhost:3000/app/marketing?campaign=campaign_990_inspiration&mode=review');

    // Click Request Change button
    const requestBtn = page.locator('button:has-text("Request Change"), button:has-text("Request Changes")').first();
    await expect(requestBtn).toBeVisible({ timeout: 10000 });
    await requestBtn.click();

    // Verify Request Change drawer opens
    const drawerHeader = page.locator('h3:has-text("Request a change"), h3:has-text("Request Changes")').first();
    await expect(drawerHeader).toBeVisible({ timeout: 10000 });

    // Verify default single material scope option
    const singleOption = page.locator('text=This material only').first();
    await expect(singleOption).toBeVisible();

    // Switch to multi-material scope option
    const multiOption = page.locator('text=Other affected materials').first();
    await expect(multiOption).toBeVisible();
    await multiOption.click();

    // Verify affected materials list appears
    await expect(page.locator('text=Social slide 1 headline').first()).toBeVisible();
  });
});
