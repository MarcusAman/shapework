import { test, expect } from '@playwright/test';

test.describe('Marketing Work Item Execution Routing', () => {
  test('displays execution modes and routing badges', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?subtab=today');
    await expect(page.locator('text=⚡ Automation').first()).toBeVisible();
    await expect(page.locator('text=👤 VA: Maria').first()).toBeVisible();
  });
});
