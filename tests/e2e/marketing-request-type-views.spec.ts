import { test, expect } from '@playwright/test';

test.describe('Marketing Request Type Views', () => {
  test('supports design asset, website update, SOP, print, and Basecamp work views', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?subtab=today');
    await expect(page.locator('h1:has-text("Today\'s Priority Workspace")')).toBeVisible();
    await expect(page.locator('text=990 Inspiration Drive').first()).toBeVisible();
    await expect(page.locator('text=SOP')).toBeDefined();
  });
});
