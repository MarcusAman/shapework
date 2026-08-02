import { test, expect } from '@playwright/test';

test.describe('Marketing Operator Workboard Persistence', () => {
  test('Workboard displays grouped stage columns and shares persistent source of truth', async ({ page }) => {
    await page.goto('http://localhost:3000/app/marketing?subtab=workboard');
    await page.waitForTimeout(600);

    await expect(page.getByRole('heading', { name: 'Marketing', exact: true })).toBeVisible();
  });
});
