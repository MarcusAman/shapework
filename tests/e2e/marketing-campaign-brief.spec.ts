import { test, expect } from '@playwright/test';

test.describe('Marketing Campaign Brief View', () => {
  test('Renders campaign brief with extracted requirements and brand/compliance versions', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_304_ocean&mode=brief');
    await page.waitForSelector('[data-testid="campaign-brief-view"]', { state: 'attached' });
    await expect(page.locator('[data-testid="campaign-brief-view"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="brief-property-title"]')).toContainText('304 Ocean Blvd');
    await expect(page.locator('[data-testid="brief-revision-badge"]')).toContainText(/Revision \d+/);
    await expect(page.locator('[data-testid="brief-brandkit-version"]')).toContainText('v2.1.0');
    await expect(page.locator('[data-testid="brief-compliance-version"]')).toContainText('v2026.1');
  });
});
