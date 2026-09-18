import { test, expect } from '@playwright/test';

test.describe('Marketing Campaign Navigation Consolidation', () => {
  test('consolidates campaign navigation to 5 views (Overview, Work, Review, Communications, History)', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&view=review');
    await page.waitForFunction(() => !document.body.innerText.includes('Loading shapework'), { timeout: 15000 });
    
    await expect(page.getByTestId('tab-overview')).toBeVisible();
    await expect(page.getByTestId('tab-work')).toBeVisible();
    await expect(page.getByTestId('tab-review')).toBeVisible();
    await expect(page.getByTestId('tab-communications')).toBeVisible();
    await expect(page.getByTestId('tab-history')).toBeVisible();

    await expect(page.getByTestId('tab-build')).toHaveCount(0);
    await expect(page.getByTestId('tab-delivery')).toHaveCount(0);
  });
});
