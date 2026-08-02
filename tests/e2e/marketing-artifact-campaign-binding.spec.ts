import { test, expect } from '@playwright/test';

test.describe('Marketing Artifact Campaign Binding', () => {
  test('Selecting postcard asset on Campaign B shows Campaign B context and no 990 artifacts', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_304_ocean&asset=postcard');
    await expect(page.locator('[data-testid="dev-identity-strip"]')).toContainText('campaign_304_ocean');
    await expect(page.locator('[data-testid="dev-identity-strip"]')).toContainText('selectedAsset: postcard');
    await expect(page.locator('[data-testid="workspace-campaign-title"]')).toContainText('304 Ocean Blvd');
    await expect(page.locator('[data-testid="workspace-campaign-title"]')).not.toContainText('990 Inspiration Drive');
  });
});
