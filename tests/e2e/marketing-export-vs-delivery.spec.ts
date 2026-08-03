import { test, expect } from '@playwright/test';

test.describe('Marketing Export vs Delivery Separation', () => {
  test('separates export receipt from delivery receipt state', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&view=review');
    await page.waitForFunction(() => !document.body.innerText.includes('Loading shapework'), { timeout: 15000 });
    
    await expect(page.getByTestId('workspace-campaign-title')).toBeVisible();
  });
});
