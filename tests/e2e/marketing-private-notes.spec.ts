import { test, expect } from '@playwright/test';

test.describe('Marketing Private Notes', () => {
  test('displays Private Note badge and section', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?subtab=today');
    await expect(page.locator('text=Private Note').first()).toBeVisible();
  });
});
