import { test, expect } from '@playwright/test';

test.describe('Marketing Cross-Campaign Contamination Prevention', () => {
  test('Ensures Campaign A facts never leak into Campaign B or C workspace', async ({ page }) => {
    // Open Campaign B
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_304_ocean');
    await expect(page.locator('[data-testid="workspace-campaign-title"]')).toContainText('304 Ocean Blvd');
    
    // Assert 990 Inspiration facts do NOT exist on Campaign B workspace
    await expect(page.locator('[data-testid="flyer-listing-price"]')).not.toContainText('$1,250,000');
    await expect(page.locator('[data-testid="flyer-agent-name"]')).not.toContainText('Ryan Crecelius');
    await expect(page.locator('[data-testid="flyer-specs-sqft-year"]')).not.toContainText('4,200 SqFt');
    await expect(page.locator('[data-testid="flyer-specs-sqft-year"]')).not.toContainText('Built 2022');

    // Open Campaign C
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_212_wetland');
    await expect(page.locator('[data-testid="workspace-campaign-title"]')).toContainText('212 Wetland Court');
    
    // Assert Campaign A and B facts do NOT exist on Campaign C workspace
    await expect(page.locator('[data-testid="flyer-listing-price"]')).not.toContainText('$1,250,000');
    await expect(page.locator('[data-testid="flyer-listing-price"]')).not.toContainText('$2,850,000');
    await expect(page.locator('[data-testid="flyer-agent-name"]')).toContainText('Sarah Jenkins');
  });
});
