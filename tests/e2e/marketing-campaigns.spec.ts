import { test, expect } from '@playwright/test';

test.describe('Marketing Campaigns & Embedded AI Assistant', () => {
  test('Campaign detail displays Ask Shapework embedded assistant with suggested prompts', async ({ page }) => {
    await page.goto('http://localhost:3000/app/marketing');
    await expect(page.locator('text=Ask Shapework about this campaign')).toBeVisible();
    await expect(page.locator('button:has-text("What is missing?")')).toBeVisible();
    await expect(page.locator('button:has-text("Change the headline.")')).toBeVisible();
  });

  test('Clicking Request Changes opens Nest Green change modal', async ({ page }) => {
    await page.goto('http://localhost:3000/app/marketing');
    const changeBtn = page.locator('button:has-text("Request Changes")').first();
    await changeBtn.click();
    await expect(page.locator('h3:has-text("Request Marketing Change")')).toBeVisible();
    await expect(page.locator('textarea')).toBeVisible();
  });
});
