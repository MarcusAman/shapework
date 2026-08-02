import { test, expect } from '@playwright/test';

test.describe('Marketing Missing Information Impact', () => {
  test('Missing information modal displays affected vs unaffected materials and resumes preparation', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_304_ocean&mode=brief');
    await page.waitForSelector('[data-testid="resolve-missing-info-btn"]');
    await page.click('[data-testid="resolve-missing-info-btn"]');
    await page.waitForSelector('[data-testid="missing-information-modal"]');
    await expect(page.locator('[data-testid="missing-information-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="affected-materials-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="unaffected-materials-list"]')).toBeVisible();
    await page.click('[data-testid="missing-info-submit-btn"]');
    await expect(page.locator('[data-testid="missing-information-modal"]')).not.toBeVisible();
  });
});
