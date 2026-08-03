import { test, expect } from '@playwright/test';

test.describe('Marketing Communication Role Truth', () => {
  test('displays explicit sender and recipient roles in communications thread', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&view=communications');
    await page.waitForFunction(() => !document.body.innerText.includes('Loading shapework'), { timeout: 15000 });
    
    await expect(page.getByTestId('multichannel-communications-tab')).toBeVisible();
    await expect(page.getByTestId('comm-entry-intake')).toBeVisible();
    await expect(page.getByTestId('comm-entry-sms-quote')).toBeVisible();
    
    const text = await page.getByTestId('comm-entry-sms-quote').textContent();
    expect(text).toContain('Quote Approver');
  });
});
