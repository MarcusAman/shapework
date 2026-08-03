import { test, expect } from '@playwright/test';

test.describe('Marketing Responsive Workspace', () => {
  test('adapts layout cleanly across 1920x1080, 1440x900, 1280x800, and mobile viewports', async ({ page }) => {
    // 1440x900
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&mode=review');
    await expect(page.locator('h2:has-text("990 Inspiration")').first()).toBeVisible({ timeout: 10000 });

    // 1920x1080
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('h2:has-text("990 Inspiration")').first()).toBeVisible();

    // 1280x800
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.locator('h2:has-text("990 Inspiration")').first()).toBeVisible();

    // Mobile (375x812)
    await page.setViewportSize({ width: 375, height: 812 });
    await expect(page.locator('h2:has-text("990 Inspiration")').first()).toBeVisible();
  });
});
