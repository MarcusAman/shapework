import { test, expect } from '@playwright/test';

test.describe('Marketing Accessibility & Keyboard Navigation', () => {
  test('left rail deliverable cards support role=tablist and arrow key navigation', async ({ page }) => {
    await page.goto('/app/marketing?campaign=campaign_990_inspiration&mode=review&asset=flyer');
    await page.waitForLoadState('networkidle');

    const tabList = page.locator('div[role="tablist"]');
    await expect(tabList).toBeVisible();

    const flyerTab = page.locator('#asset-nav-flyer');
    await expect(flyerTab).toHaveAttribute('aria-selected', 'true');

    // Focus flyer tab and press ArrowDown
    await flyerTab.focus();
    await page.keyboard.press('ArrowDown');

    const socialTab = page.locator('#asset-nav-carousel');
    await expect(socialTab).toHaveAttribute('aria-selected', 'true');
    await expect(page).toHaveURL(/.*asset=carousel.*/);
  });
});
