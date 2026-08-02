import { test, expect } from '@playwright/test';

test.describe('Marketing Missing Information Flow', () => {
  test('opens custom missing information modal without native browser alerts', async ({ page }) => {
    let alertFired = false;
    page.on('dialog', (dialog) => {
      alertFired = true;
      dialog.dismiss();
    });

    await page.goto('http://localhost:3000/app/marketing');
    const provideBtn = page.locator('button:has-text("Provide Information")').first();
    await expect(provideBtn).toBeVisible({ timeout: 10000 });
    await provideBtn.click();

    // Verify in-app modal opens
    const modal = page.locator('h3:has-text("Open-house time needed")');
    await expect(modal).toBeVisible();

    // Verify native alert never fired
    expect(alertFired).toBe(false);

    // Verify form submission button
    const submitBtn = page.locator('button:has-text("Save and continue preparation")');
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Modal closes cleanly
    await expect(modal).not.toBeVisible();
  });
});
