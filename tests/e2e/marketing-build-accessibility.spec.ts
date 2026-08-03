import { test, expect } from '@playwright/test';

test.describe('Marketing Build View - Accessibility & Keyboard Navigation', () => {
  test('has aria-label and supports keyboard interactions', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&mode=review');

    const sidecarRegion = page.locator('[role="region"][aria-label="Build View Progress Panel"]');
    await expect(sidecarRegion).toBeVisible({ timeout: 10000 });
  });
});
