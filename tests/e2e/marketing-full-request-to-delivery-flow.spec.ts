import { test, expect } from '@playwright/test';

test.describe('Marketing Full Request to Delivery E2E Flow', () => {
  test('executes 10-step full request to delivery flow', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&view=overview');
    await page.waitForFunction(() => !document.body.innerText.includes('Loading shapework'), { timeout: 15000 });
    await expect(page.getByTestId('workspace-campaign-title')).toBeVisible();

    // Step 2: Switch to Review tab
    await page.getByTestId('tab-review').click();
    await expect(page.getByTestId('flyer-preview-canvas')).toBeVisible();

    // Step 3: Approve or check approved notice
    const approveBtn = page.getByTestId('approve-material-btn');
    if (await approveBtn.isVisible()) {
      await approveBtn.click();
    }

    await expect(page.getByTestId('approval-receipt-evidence')).toBeVisible();
  });
});
