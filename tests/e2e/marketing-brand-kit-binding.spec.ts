import { test, expect } from '@playwright/test';

test.describe('Marketing Brand Kit Binding', () => {
  test('Review panel renders versioned brand kit checks', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&mode=review');
    await expect(page.locator('[data-testid="review-brand-checks"]')).toBeVisible();
    await expect(page.locator('[data-testid="review-brand-checks"]')).toContainText('v2.1.0');
  });
});
