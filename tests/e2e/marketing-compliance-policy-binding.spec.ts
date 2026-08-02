import { test, expect } from '@playwright/test';

test.describe('Marketing Compliance Policy Binding', () => {
  test('Review panel renders versioned compliance policy checks', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&mode=review');
    await expect(page.locator('[data-testid="review-compliance-checks"]')).toBeVisible();
    await expect(page.locator('[data-testid="review-compliance-checks"]')).toContainText('v2026.1');
  });
});
