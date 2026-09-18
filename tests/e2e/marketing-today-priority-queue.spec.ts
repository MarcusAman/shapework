import { test, expect } from '@playwright/test';

test.describe('Marketing Today Priority Queue', () => {
  test('displays Melissa Today priority queue with operational metrics and sections', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?subtab=today');
    await expect(page.locator('h1:has-text("Today\'s Priority Workspace")')).toBeVisible();
    await expect(page.locator('button:has-text("Plan Tomorrow")')).toBeVisible();
  });
});
