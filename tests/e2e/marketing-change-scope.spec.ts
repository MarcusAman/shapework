import { test, expect } from '@playwright/test';

test.describe('Marketing Change Scope Flow', () => {
  test('Request change defaults to single material scope and warns on cross-material scope', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&mode=review');
    await page.click('[data-testid="request-change-btn"]');
    await expect(page.locator('[data-testid="request-change-drawer"]')).toBeVisible();
    await expect(page.locator('[data-testid="change-scope-single"]')).toBeChecked();

    // Select cross-material scope
    await page.click('[data-testid="change-scope-cross"]');
    await expect(page.locator('[data-testid="cross-affected-materials-list"]')).toBeVisible();

    await page.click('[data-testid="submit-change-request-btn"]');
    await expect(page.locator('[data-testid="reapprove-warning-box"]')).toBeVisible();
  });
});
