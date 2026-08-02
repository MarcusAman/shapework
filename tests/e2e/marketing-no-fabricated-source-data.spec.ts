import { test, expect } from '@playwright/test';

test.describe('Marketing No Fabricated Source Data', () => {
  test('Demo requests and connections are explicitly labeled as Demo', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&mode=brief');
    await page.click('[data-testid="open-original-communication-btn"]');
    await expect(page.locator('[data-testid="raw-communication-text"]')).toContainText('Manual Intake Notes');
  });
});
