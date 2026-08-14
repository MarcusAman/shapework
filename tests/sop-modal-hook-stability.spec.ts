import { test, expect } from '@playwright/test';

test.describe('SOP Modal Hook Stability & Open-Close Cycles', () => {
  test('modal opens and closes repeatedly without React Hook errors', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('http://localhost:3049/app/sops?subtab=today');
    await page.waitForLoadState('networkidle');

    // Cycle 1: Open & Close
    await page.click('button:has-text("Create New SOP"), button:has-text("Build an SOP")');
    await expect(page.locator('h2:has-text("Build an SOP together")')).toBeVisible();
    await page.click('button:has-text("Close"), button[title="Close"], svg.lucide-x');
    await expect(page.locator('h2:has-text("Build an SOP together")')).not.toBeVisible();

    // Cycle 2: Open & Close
    await page.click('button:has-text("Create New SOP"), button:has-text("Build an SOP")');
    await expect(page.locator('h2:has-text("Build an SOP together")')).toBeVisible();
    await page.click('button:has-text("Close"), button[title="Close"], svg.lucide-x');

    // Cycle 3: Open & Close
    await page.click('button:has-text("Create New SOP"), button:has-text("Build an SOP")');
    await expect(page.locator('h2:has-text("Build an SOP together")')).toBeVisible();

    // Check for hook errors
    const hookErrors = pageErrors.filter((e) => e.includes('Rendered more hooks') || e.includes('Rendered fewer hooks'));
    expect(hookErrors).toEqual([]);
    expect(pageErrors.filter((e) => e.includes('ReferenceError'))).toEqual([]);
  });
});
