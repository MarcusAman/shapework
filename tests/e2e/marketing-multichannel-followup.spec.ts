import { test, expect } from '@playwright/test';

test.describe('Marketing Multichannel Follow-up', () => {
  test('displays SMS quote approval thread in communications timeline', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&mode=communications');
    await expect(page.locator('text=Text/SMS Quote Approval Thread')).toBeVisible({ timeout: 10000 });
  });
});
