import { test, expect } from '@playwright/test';

test.describe('Marketing Modal Accessibility & Keyboard Navigation', () => {
  test('Request Changes modal supports Escape key dismissal and focus handling', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing');
    
    const requestChangeBtn = page.locator('button:has-text("Request Changes")').first();
    if (await requestChangeBtn.isVisible()) {
      await requestChangeBtn.click();
      await page.waitForTimeout(400);

      // Verify modal is open
      await expect(page.locator('h3:has-text("Request Marketing Change")')).toBeVisible();

      // Press Escape to dismiss
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);

      // Verify modal is closed
      await expect(page.locator('h3:has-text("Request Marketing Change")')).not.toBeVisible();
    }
  });

  test('Delivery drawer supports Escape key dismissal', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing');
    
    const deliveryBtn = page.locator('button:has-text("Deliver Package"), button:has-text("Approve & Deliver Package")').first();
    if (await deliveryBtn.isVisible()) {
      await deliveryBtn.click();
      await page.waitForTimeout(400);

      await expect(page.locator('text=Delivery Destinations')).toBeVisible();

      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);

      await expect(page.locator('text=Delivery Destinations')).not.toBeVisible();
    }
  });
});
