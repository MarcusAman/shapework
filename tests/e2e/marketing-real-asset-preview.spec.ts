import { test, expect } from '@playwright/test';

test.describe('Marketing Real Asset Preview Enforcement', () => {
  test('renders real asset preview canvas for Property Flyer', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&view=review&asset=flyer');
    await page.waitForFunction(() => !document.body.innerText.includes('Loading shapework'), { timeout: 15000 });
    
    await expect(page.getByTestId('flyer-preview-canvas')).toBeVisible();
    await expect(page.getByTestId('flyer-property-address')).toBeVisible();
    await expect(page.getByTestId('flyer-listing-price')).toBeVisible();
  });
});
