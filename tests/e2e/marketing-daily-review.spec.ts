import { test, expect } from '@playwright/test';

test.describe('Marketing Daily Review Ritual', () => {
  test('opens Plan Tomorrow modal and saves daily planning snapshot', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?subtab=today');
    const btn = page.locator('button:has-text("Plan Tomorrow")');
    await expect(btn).toBeVisible();
    await btn.click();
    await expect(page.locator('h2:has-text("Plan Tomorrow\'s Operating Queue")')).toBeVisible();
    await page.locator('button:has-text("Commit Tomorrow\'s Work Plan")').click();
    await expect(page.locator('h2:has-text("Plan Tomorrow\'s Operating Queue")')).not.toBeVisible();
  });
});
