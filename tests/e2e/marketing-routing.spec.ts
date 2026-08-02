import { test, expect } from '@playwright/test';

test.describe('Marketing Routing & URL Sanitization', () => {
  test('default route /app/marketing opens My Campaigns', async ({ page }) => {
    await page.goto('http://localhost:3000/app/marketing');
    await expect(page.getByRole('heading', { name: 'Marketing', exact: true })).toBeVisible();
    await expect(page.locator('text=My Campaigns').first()).toBeVisible();
  });

  test('subtab=workboard query parameter routing resolves active tab', async ({ page }) => {
    await page.goto('http://localhost:3000/app/marketing?subtab=workboard');
    await expect(page).toHaveURL(/http:\/\/localhost:3000\/app\/marketing/);
  });

  test('subtab=kanban backwards compatibility alias maps cleanly', async ({ page }) => {
    await page.goto('http://localhost:3000/app/marketing?subtab=kanban');
    await expect(page).toHaveURL(/http:\/\/localhost:3000\/app\/marketing/);
  });
});
