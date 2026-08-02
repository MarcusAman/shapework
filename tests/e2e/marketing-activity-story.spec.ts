import { test, expect } from '@playwright/test';

test.describe('Marketing Activity Story View', () => {
  test('Activity view renders human-readable narrative timeline', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_304_ocean&mode=activity');
    await expect(page.locator('[data-testid="campaign-activity-story"]')).toBeVisible();
    await expect(page.locator('[data-testid="activity-story-event"]').first()).toBeVisible();
  });
});
