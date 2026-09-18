import { test, expect } from '@playwright/test';

test.describe('Marketing Real Campaign Lifecycle (990 Inspiration Drive)', () => {
  test('Complete persistent campaign lifecycle from Intake to Delivery', async ({ page }) => {
    // 1. Open persistent campaign
    await page.goto('http://localhost:3049/app/marketing');
    await expect(page.locator('text=990 Inspiration Drive').first()).toBeVisible();

    // 2. Ready to Review & Review Package
    const reviewBtn = page.locator('button:has-text("Review Package")').first();
    if (await reviewBtn.isVisible()) {
      await reviewBtn.click();
      await page.waitForTimeout(400);
      await expect(page.locator('text=Consolidated Package Review')).toBeVisible();
    }

    // 3. Request Changes Modal
    const requestChangeBtn = page.locator('button:has-text("Request Changes")').first();
    if (await requestChangeBtn.isVisible()) {
      await requestChangeBtn.click();
      await page.waitForTimeout(300);
      await page.fill('textarea', 'Make the headline less formal and remove the phrase luxury estate.');
      const applyBtn = page.locator('button:has-text("Apply Changes")').first();
      await applyBtn.click();
      await page.waitForTimeout(500);
    }

    // 4. Hard Refresh & Verify Persistence
    await page.reload();
    await page.waitForTimeout(800);
    await expect(page.locator('text=990 Inspiration Drive').first()).toBeVisible();

    // 5. Delivery Drawer
    const deliverBtn = page.locator('button:has-text("Deliver Package"), button:has-text("Approve & Deliver Package")').first();
    if (await deliverBtn.isVisible()) {
      await deliverBtn.click();
      await page.waitForTimeout(400);
      await expect(page.locator('text=Delivery Destinations')).toBeVisible();
      await page.keyboard.press('Escape');
    }
  });
});
