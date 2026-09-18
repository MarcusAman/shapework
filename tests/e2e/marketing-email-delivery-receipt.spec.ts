import { test, expect } from '@playwright/test';

test.describe('Marketing Email Delivery Receipt', () => {
  test('displays outbound email proof delivery record', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&mode=communications');
    await expect(page.locator('text=Outbound Proof Delivery Email Record')).toBeVisible();
  });
});
