import { test, expect } from '@playwright/test';

test.describe('Marketing Persistent Next-Action Banner', () => {
  test('renders persistent next-action banner with action title and primary button', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&view=review');
    await page.waitForFunction(() => !document.body.innerText.includes('Loading shapework'), { timeout: 15000 });
    
    await expect(page.getByTestId('campaign-next-action-banner')).toBeVisible();
    await expect(page.getByTestId('next-action-title')).toBeVisible();
    await expect(page.getByTestId('next-action-btn')).toBeVisible();
  });
});
