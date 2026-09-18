import { test, expect } from '@playwright/test';

test.describe('Marketing VA Role Access', () => {
  test('VA workspace renders correctly', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?subtab=va');
    await expect(page.locator('[data-testid="marketing-va-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="va-empty-state"]')).toBeVisible();
  });
});
