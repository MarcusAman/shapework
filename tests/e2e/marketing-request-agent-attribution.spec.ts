import { test, expect } from '@playwright/test';

test.describe('Marketing Request Agent Attribution', () => {
  test('Distinguishes capturing AI agent from human requester', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_304_ocean&mode=brief');
    await expect(page.locator('[data-testid="brief-requested-by"]')).toContainText('Eric');
    await expect(page.locator('[data-testid="brief-captured-by"]')).toContainText('Ava');
  });
});
