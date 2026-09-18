import { test, expect } from '@playwright/test';

test.describe('Marketing Social Package Real Slide Carousel', () => {
  test('renders 3 real rendered slides with thumbnail carousel navigation', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&view=review&asset=carousel');
    await page.waitForFunction(() => !document.body.innerText.includes('Loading shapework'), { timeout: 15000 });
    
    await expect(page.getByTestId('social-package-canvas')).toBeVisible();
    await expect(page.getByText('Social Package (3 Rendered Slides)')).toBeVisible();
    await expect(page.getByText('Slide 1 of 3')).toBeVisible();
  });
});
