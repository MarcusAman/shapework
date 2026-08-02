import { test, expect } from '@playwright/test';

test.describe('Marketing Approval Receipts Truth', () => {
  test('Approved campaign workspace renders accurate reviewer receipt name', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration');
    await expect(page.locator('[data-testid="approved-by-agent"]')).toContainText('Approved by Ryan Crecelius');
  });
});
