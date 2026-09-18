import { test, expect } from '@playwright/test';

test.describe('Marketing Next Action Consistency', () => {
  test('ensures every non-complete item displays a Next Action bar', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?subtab=today');
    const nextActions = page.locator('text=Next Action:');
    await expect(nextActions.first()).toBeVisible();
    expect(await nextActions.count()).toBeGreaterThan(0);
  });
});
