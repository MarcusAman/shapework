import { test, expect } from '@playwright/test';

test.describe('Marketing Approval Receipt Evidence', () => {
  test('displays approval receipt evidence with version, checksum, and reviewer', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&view=review&asset=flyer');
    await page.waitForFunction(() => !document.body.innerText.includes('Loading shapework'), { timeout: 15000 });
    
    await expect(page.getByTestId('approval-receipt-evidence')).toBeVisible();
    const receiptText = await page.getByTestId('approval-receipt-evidence').textContent();
    expect(receiptText).toContain('Reviewed version');
    expect(receiptText).toContain('Approved by');
    expect(receiptText).toContain('Checksum');
  });
});
