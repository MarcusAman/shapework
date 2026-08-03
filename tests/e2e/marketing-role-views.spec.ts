import { test, expect } from '@playwright/test';

test.describe('Marketing Role-Based Views & Authorization', () => {
  test('Listing agent view shows My Campaigns and Completed without Workboard/Templates', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing');
    await expect(page.locator('button:has-text("My Campaigns")').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Completed', exact: true })).toBeVisible();
    await expect(page.locator('button:has-text("Workboard")')).not.toBeVisible();
    await expect(page.locator('button:has-text("Marketing Templates")')).not.toBeVisible();
  });

  test('Ordinary agent cannot reveal Advanced Editor', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing');
    await expect(page.locator('button:has-text("Open Advanced Editor")')).not.toBeVisible();
  });
});
