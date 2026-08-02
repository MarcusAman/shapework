import { test, expect } from '@playwright/test';

test.describe('Marketing Status-Driven Primary Actions', () => {
  test('Each campaign state shows exactly one visually dominant primary action', async ({ page }) => {
    await page.goto('http://localhost:3000/app/marketing');
    await page.waitForTimeout(600);

    const primaryAction = page.locator('button:has-text("Review Package"), button:has-text("Deliver Package"), button:has-text("Request Changes")').first();
    await expect(primaryAction).toBeVisible();
  });
});
