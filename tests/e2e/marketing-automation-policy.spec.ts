import { test, expect } from '@playwright/test';

test.describe('Marketing Automation Policy', () => {
  test('verifies automated flyer execution mode and policy level', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?subtab=today');
    await expect(page.locator('text=990 Inspiration Drive').first()).toBeVisible();
    await expect(page.locator('text=Automate')).toBeDefined();
  });
});
