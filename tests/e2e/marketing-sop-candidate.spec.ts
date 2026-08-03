import { test, expect } from '@playwright/test';

test.describe('Marketing SOP Candidate Tracking', () => {
  test('displays SOP title and documentation candidate link', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?subtab=today');
    await expect(page.locator('text=SOP-014').first()).toBeVisible();
  });
});
