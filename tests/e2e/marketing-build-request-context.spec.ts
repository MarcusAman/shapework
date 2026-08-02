import { test, expect } from '@playwright/test';

test.describe('Marketing Build Request Context', () => {
  test('Build view connects progress to request story', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_304_ocean&mode=build');
    await expect(page.locator('[data-testid="build-view-sidecar"]')).toBeVisible();
    await expect(page.locator('[data-testid="build-view-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="build-progress-text"]')).toBeVisible();
  });
});
