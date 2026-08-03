import { test, expect } from '@playwright/test';

test.describe('Marketing Refresh State Persistence', () => {
  test('persists campaign view and selected asset across page reload', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&view=review&asset=carousel');
    await page.waitForFunction(() => !document.body.innerText.includes('Loading shapework'), { timeout: 15000 });
    
    await expect(page.getByTestId('social-package-canvas')).toBeVisible();
    
    await page.reload();
    await page.waitForFunction(() => !document.body.innerText.includes('Loading shapework'), { timeout: 15000 });
    
    expect(page.url()).toContain('view=review');
    expect(page.url()).toContain('asset=carousel');
    await expect(page.getByTestId('social-package-canvas')).toBeVisible();
  });
});
