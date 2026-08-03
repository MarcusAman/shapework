import { test, expect } from '@playwright/test';

test.describe('Marketing Basecamp Reference', () => {
  test('displays Basecamp reference label on HQ-linked tasks', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?subtab=today');
    await expect(page.locator('text=Basecamp reference').first()).toBeVisible();
  });
});
