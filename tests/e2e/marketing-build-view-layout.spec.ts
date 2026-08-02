import { test, expect } from '@playwright/test';

test.describe('Marketing Build View Layout', () => {
  test('displays Build View sidecar only during active preparation', async ({ page }) => {
    await page.goto('http://localhost:3000/app/marketing?campaign=campaign_990_inspiration&mode=build');

    // Build View sidecar container
    const sidecar = page.locator('[role="region"][aria-label="Build View Progress Panel"]');
    await expect(sidecar).toBeVisible({ timeout: 10000 });

    // Preparation count
    await expect(page.locator('text=materials ready').first()).toBeVisible({ timeout: 10000 });
  });
});
