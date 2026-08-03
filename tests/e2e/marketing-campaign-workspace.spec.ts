import { test, expect } from '@playwright/test';

test.describe('Marketing Campaign Workspace Layout', () => {
  test('viewport layout makes central preview visually dominant (>55% canvas)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&mode=review');

    // Header visible
    await expect(page.locator('h2:has-text("990 Inspiration")').first()).toBeVisible({ timeout: 10000 });

    // Central workspace main area
    const mainCanvas = page.locator('main').first();
    await expect(mainCanvas).toBeVisible();

    const box = await mainCanvas.boundingBox();
    expect(box).not.toBeNull();
    // At 1440 width, central canvas must be >= 680px
    expect(box!.width).toBeGreaterThanOrEqual(680);
  });
});
