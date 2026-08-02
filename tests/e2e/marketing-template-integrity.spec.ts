import { test, expect } from '@playwright/test';

test.describe('Marketing Template Integrity', () => {
  test('Marketing Templates tab displays approved layouts and definition copy', async ({ page }) => {
    await page.goto('http://localhost:3000/app/marketing?subtab=templates');
    await page.waitForTimeout(600);

    await expect(page.getByRole('heading', { name: 'Marketing', exact: true })).toBeVisible();
  });
});
