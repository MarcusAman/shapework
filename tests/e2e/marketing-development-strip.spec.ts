import { test, expect } from '@playwright/test';

test.describe('Marketing Development Strip', () => {
  test('Development identity strip displays requestId, brandKitVersion, and complianceVersion in dev mode', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration');
    await expect(page.locator('[data-testid="dev-identity-strip"]')).toBeVisible();
    await expect(page.locator('[data-testid="dev-identity-strip"]')).toContainText('requestId:');
    await expect(page.locator('[data-testid="dev-identity-strip"]')).toContainText('brandKitVersion:');
    await expect(page.locator('[data-testid="dev-identity-strip"]')).toContainText('complianceVersion:');
  });
});
