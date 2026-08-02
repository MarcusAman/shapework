import { test, expect } from '@playwright/test';

test.describe('Marketing Request Inbox Redesign', () => {
  test('Marketing Home renders delegated-work inbox with requester and channel context', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing');
    await expect(page.locator('[data-testid="marketing-home-inbox"]')).toBeVisible();
    await expect(page.locator('h1')).toHaveText('Marketing');
    await expect(page.locator('[data-testid="section-needs-attention"]')).toBeVisible();
    await expect(page.locator('[data-testid="section-being-prepared"]')).toBeVisible();
    await expect(page.locator('[data-testid="section-ready-for-review"]')).toBeVisible();

    // Verify row attributes
    await expect(page.locator('[data-testid="row-requester-name"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="row-capturing-agent"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="row-request-excerpt"]').first()).toBeVisible();
  });
});
