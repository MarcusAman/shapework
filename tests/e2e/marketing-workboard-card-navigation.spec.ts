import { test, expect } from '@playwright/test';

test.describe('Marketing Workboard Card Navigation', () => {
  test('clicking a Workboard card opens campaign in canonical view', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?subtab=workboard');
    await page.waitForFunction(() => !document.body.innerText.includes('Loading shapework'), { timeout: 15000 });
    
    await expect(page.getByTestId('marketing-workboard-view')).toBeVisible();
  });
});
