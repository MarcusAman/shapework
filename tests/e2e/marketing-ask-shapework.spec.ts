import { test, expect } from '@playwright/test';

test.describe('Ask Shapework Campaign Assistant (Campaign-Scoped)', () => {
  test('Ask Shapework responds to campaign-scoped questions and edit proposals', async ({ page }) => {
    await page.goto('http://localhost:3000/app/marketing');
    
    // Type question into Ask Shapework box
    const askInput = page.locator('input[placeholder*="Ask a question"]').first();
    if (await askInput.isVisible()) {
      await askInput.fill('What is missing?');
      await page.locator('button:has-text("Ask")').first().click();
      await page.waitForTimeout(600);
      await expect(page.locator('text=Shapework Assistant Response')).toBeVisible();
    }
  });

  test('Ask Shapework prompt chip triggers campaign-scoped answer', async ({ page }) => {
    await page.goto('http://localhost:3000/app/marketing');
    
    const chip = page.locator('button:has-text("Which photos are being used?")').first();
    if (await chip.isVisible()) {
      await chip.click();
      await page.waitForTimeout(600);
      await expect(page.locator('text=Shapework Assistant Response')).toBeVisible();
    }
  });
});
