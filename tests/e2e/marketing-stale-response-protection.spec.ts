import { test, expect } from '@playwright/test';

test.describe('Marketing Stale Response Protection', () => {
  test('Rapid navigation between campaigns retains exact target campaign identity', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration');
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_304_ocean');
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_212_wetland');

    await expect(page.locator('[data-testid="dev-identity-strip"]')).toContainText('campaign_212_wetland');
    await expect(page.locator('[data-testid="workspace-campaign-title"]')).toContainText('212 Wetland Court');
    await expect(page.locator('[data-testid="flyer-agent-name"]')).toContainText('Sarah Jenkins');
  });
});
