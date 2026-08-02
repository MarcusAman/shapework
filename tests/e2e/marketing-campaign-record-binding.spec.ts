import { test, expect } from '@playwright/test';

test.describe('Marketing Campaign Record Binding', () => {
  test('Open Campaign A, B, and C and verify exact identity isolation', async ({ page }) => {
    // 1. Campaign A (990 Inspiration Drive)
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration');
    await expect(page.locator('[data-testid="dev-identity-strip"]')).toContainText('campaign_990_inspiration');
    await expect(page.locator('[data-testid="workspace-campaign-title"]')).toContainText('990 Inspiration Drive');
    await expect(page.locator('[data-testid="flyer-listing-price"]')).toContainText('$1,250,000');
    await expect(page.locator('[data-testid="flyer-agent-name"]')).toContainText('Ryan Crecelius');

    // 2. Campaign B (304 Ocean Blvd)
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_304_ocean');
    await expect(page.locator('[data-testid="dev-identity-strip"]')).toContainText('campaign_304_ocean');
    await expect(page.locator('[data-testid="workspace-campaign-title"]')).toContainText('304 Ocean Blvd');
    await expect(page.locator('[data-testid="flyer-listing-price"]')).toContainText('$2,850,000');
    await expect(page.locator('[data-testid="flyer-agent-name"]')).toContainText('Eric');
    await expect(page.locator('body')).not.toContainText('990 Inspiration Drive');

    // 3. Campaign C (212 Wetland Court)
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_212_wetland');
    await expect(page.locator('[data-testid="dev-identity-strip"]')).toContainText('campaign_212_wetland');
    await expect(page.locator('[data-testid="workspace-campaign-title"]')).toContainText('212 Wetland Court');
    await expect(page.locator('[data-testid="flyer-listing-price"]')).toContainText('$875,000');
    await expect(page.locator('[data-testid="flyer-agent-name"]')).toContainText('Sarah Jenkins');
    await expect(page.locator('body')).not.toContainText('990 Inspiration Drive');
  });

  test('Shows Campaign Unavailable error when campaign ID does not exist', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?campaign=non_existent_campaign_9999');
    await expect(page.locator('[data-testid="campaign-unavailable-heading"]')).toHaveText('Campaign unavailable');
    await expect(page.locator('[data-testid="campaign-unavailable-text"]')).toContainText('This campaign could not be found');
  });
});
