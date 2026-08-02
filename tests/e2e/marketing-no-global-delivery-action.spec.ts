import { test, expect } from '@playwright/test';

test.describe('Marketing No Global Delivery Action', () => {
  test('Verifies no global Deliver Package button exists on Marketing Home or Header', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing');
    await expect(page.locator('header button:has-text("Deliver Package")')).toHaveCount(0);
    await expect(page.locator('button:has-text("Deliver Package")')).toHaveCount(0);
  });
});
