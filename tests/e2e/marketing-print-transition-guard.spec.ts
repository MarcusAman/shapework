import { test, expect } from '@playwright/test';

test.describe('Marketing Strict Print Transition Guard', () => {
  test('enables only current valid print transition action', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&view=work');
    await page.waitForFunction(() => !document.body.innerText.includes('Loading shapework'), { timeout: 15000 });
    
    await expect(page.getByTestId('print-and-quote-card')).toBeVisible();
    await expect(page.getByTestId('print-action-approve-quote')).toBeEnabled();
    
    await expect(page.getByTestId('print-action-send-to-vendor')).toBeDisabled();
    await expect(page.getByTestId('print-action-ready-pickup')).toBeDisabled();
  });
});
