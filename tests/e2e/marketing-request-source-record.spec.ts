import { test, expect } from '@playwright/test';

test.describe('Marketing Request Source Record', () => {
  test('Opens original communication drawer showing verbatim transcript and AI summary', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_304_ocean&mode=brief');
    await page.click('[data-testid="open-original-communication-btn"]');
    await expect(page.locator('[data-testid="original-communication-drawer"]')).toBeVisible();
    await expect(page.locator('[data-testid="raw-communication-text"]')).toContainText('Ava: Hello Eric');
    await expect(page.locator('[data-testid="extracted-objective"]')).toBeVisible();
    await page.click('[data-testid="close-communication-drawer"]');
    await expect(page.locator('[data-testid="original-communication-drawer"]')).not.toBeVisible();
  });
});
