import { test, expect } from '@playwright/test';

test.describe('Marketing State Derivation', () => {
  test('derives status badges from work item and asset states', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?subtab=today');
    await expect(page.locator('text=ready for review').first()).toBeVisible();
  });
});
