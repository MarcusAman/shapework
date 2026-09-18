import { test, expect } from '@playwright/test';

test.describe('Marketing VA Readiness Rules', () => {
  test('displays certified VA readiness and SOP checklist', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?subtab=va_workspace');
    await expect(page.locator('text=Readiness: 100% Certified')).toBeVisible();
    await expect(page.locator('text=Required Standard Operating Procedure')).toBeVisible();
  });
});
