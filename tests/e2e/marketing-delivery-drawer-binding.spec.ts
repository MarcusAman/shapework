import { test, expect } from '@playwright/test';

test.describe('Marketing Delivery Drawer Binding', () => {
  test('Delivery drawer displays exact selected campaign property address', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration');
    await page.click('button:has-text("Delivery Options")');
    await expect(page.locator('h3:has-text("Delivery options") + p')).toContainText('990 Inspiration Drive');
  });
});
