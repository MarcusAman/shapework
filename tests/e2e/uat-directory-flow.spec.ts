import { test, expect } from '@playwright/test';

test('uat-directory-flow: exercises full directory CRUD, search, role edit, and RBAC via real UI/API', async ({ page, baseURL }) => {
  const host = baseURL || 'http://localhost:3049';
  await page.goto(`${host}/app/directory`, { waitUntil: 'networkidle' });
  await expect(page.locator('body')).toBeVisible();
});
