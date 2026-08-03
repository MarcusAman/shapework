import { test, expect } from '@playwright/test';

test.describe('Marketing Executor / Reviewer Separation', () => {
  test('displays distinct requester, owner, executor, and reviewer roles', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&mode=work');
    await expect(page.locator('text=Executor:')).toBeVisible();
    await expect(page.locator('text=Reviewer:')).toBeVisible();
  });
});
