import { test, expect } from '@playwright/test';

test.describe('Marketing Price Quote Approval', () => {
  test('displays quote amount, status, and approval button', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?subtab=today');
    await expect(page.locator('text=$185.00').first()).toBeVisible();
    await expect(page.locator('button:has-text("Approve Quote ($185)")').first()).toBeVisible();
  });
});
