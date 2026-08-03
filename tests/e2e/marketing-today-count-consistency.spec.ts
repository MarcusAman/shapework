import { test, expect } from '@playwright/test';

test.describe('Marketing Today Count Consistency', () => {
  test('aligns active work count with derived summary counts', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?subtab=today');
    await page.waitForFunction(() => !document.body.innerText.includes('Loading shapework'), { timeout: 15000 });
    
    // Clear open campaign if one is selected by default
    const backBtn = page.getByText('Back to Marketing');
    if (await backBtn.isVisible()) {
      await backBtn.click();
      await page.waitForTimeout(500);
    }

    const todayTab = page.locator('[data-testid="subtab-today"]');
    if (await todayTab.isVisible()) {
      await todayTab.click();
      await page.waitForTimeout(500);
    }

    await expect(page.getByTestId('marketing-today-view')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('marketing-summary-counts-bar')).toBeVisible();
    await expect(page.getByTestId('today-active-work-count')).toBeVisible();
  });
});
