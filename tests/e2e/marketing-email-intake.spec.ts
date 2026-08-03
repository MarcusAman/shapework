import { test, expect } from '@playwright/test';

test.describe('Marketing Email Intake', () => {
  test('displays inbound email message details in communications timeline', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&mode=communications');
    await expect(page.locator('text=Inbound Request Message')).toBeVisible();
    await expect(page.locator('text=Eric Anderson')).toBeVisible();
  });
});
