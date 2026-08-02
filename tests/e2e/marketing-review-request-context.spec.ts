import { test, expect } from '@playwright/test';

test.describe('Marketing Review Request Context', () => {
  test('Review mode displays requester and AI agent context in header and side panel', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_304_ocean&mode=review');
    await expect(page.locator('[data-testid="workspace-requester-attribution"]')).toBeVisible();
    await expect(page.locator('[data-testid="workspace-requester-attribution"]')).toContainText('Eric');
    await expect(page.locator('[data-testid="workspace-requester-attribution"]')).toContainText('Ava');
  });
});
