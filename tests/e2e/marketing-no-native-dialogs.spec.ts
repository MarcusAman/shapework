import { test, expect } from '@playwright/test';

test.describe('Marketing No Native Dialogs Enforcement', () => {
  test('strictly prohibits native browser alert, confirm, or prompt dialogs', async ({ page }) => {
    let nativeDialogTriggered = false;
    let dialogMessage = '';

    page.on('dialog', (dialog) => {
      nativeDialogTriggered = true;
      dialogMessage = dialog.message();
      dialog.dismiss();
    });

    // 1. Visit Marketing Home Inbox
    await page.goto('http://localhost:3049/app/marketing');
    await expect(page.locator('text=Campaigns and listing requests prepared by Shapework')).toBeVisible({ timeout: 10000 });

    // 2. Click Provide Information button
    const provideBtn = page.locator('button:has-text("Provide Information")').first();
    await expect(provideBtn).toBeVisible();
    await provideBtn.click();
    await page.waitForTimeout(400);

    // 3. Open workspace view
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&mode=review');
    await expect(page.locator('h2:has-text("990 Inspiration")').first()).toBeVisible();

    // Assert zero native browser dialogs occurred throughout the flow
    expect(nativeDialogTriggered, `Native browser dialog triggered: "${dialogMessage}"`).toBe(false);
  });
});
