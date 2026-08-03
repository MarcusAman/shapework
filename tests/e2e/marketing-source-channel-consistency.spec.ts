import { test, expect } from '@playwright/test';

test.describe('Marketing Source Channel Consistency', () => {
  test('uses consistent source channel label across header and brief', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&view=overview');
    await page.waitForFunction(() => !document.body.innerText.includes('Loading shapework'), { timeout: 15000 });
    
    await expect(page.getByTestId('workspace-requester-attribution')).toBeVisible();
    const headerAttribution = await page.getByTestId('workspace-requester-attribution').textContent();
    expect(headerAttribution).not.toContain('Phone call'); // Manual intake in single truth
  });
});
