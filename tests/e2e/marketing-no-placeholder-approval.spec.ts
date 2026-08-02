import { test, expect } from '@playwright/test';

test.describe('Marketing No Placeholder Approval', () => {
  test('Unrendered placeholder displays Preview Not Available and disables Approve button', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_212_wetland&asset=postcard');
    await expect(page.locator('[data-testid="placeholder-heading"]')).toHaveText('Preview not available');
    await expect(page.locator('[data-testid="placeholder-subtext"]')).toContainText('This material has not been rendered yet');
    await expect(page.locator('[data-testid="approve-material-disabled"]')).toBeVisible();
  });
});
