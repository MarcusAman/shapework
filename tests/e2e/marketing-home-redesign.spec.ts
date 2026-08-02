import { test, expect } from '@playwright/test';

test.describe('Marketing Home Redesign', () => {
  test('renders clean campaign inbox without operator hotline or simulate controls', async ({ page }) => {
    await page.goto('http://localhost:3000/app/marketing');
    await page.waitForTimeout(500);

    // Verify customer header text
    await expect(page.locator('text=Campaigns and listing requests prepared by Shapework')).toBeVisible({ timeout: 10000 });

    // Verify operator controls are NOT visible in ordinary view
    await expect(page.locator('text=Marketing Hotline')).not.toBeVisible();
    await expect(page.locator('text=Simulate Inbound Call')).not.toBeVisible();

    // Verify standardized campaign rows exist
    await expect(page.locator('text=990 Inspiration Drive').first()).toBeVisible();
    await expect(page.locator('text=New Marketing Request').first()).toBeVisible();
  });
});
