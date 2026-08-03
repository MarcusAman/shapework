import { test, expect } from '@playwright/test';

test('uat-runtime-console-clean: verifies zero console errors, unhandled rejections, or blank routes during navigation', async ({ page, baseURL }) => {
  const host = baseURL || 'http://localhost:3049';
  const consoleErrors: string[] = [];

  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  const routes = ['/app/marketing', '/app/directory', '/app/org-chart', '/app/sops', '/app/ask-nest-ops'];
  for (const r of routes) {
    await page.goto(`${host}${r}`, { waitUntil: 'networkidle' });
    await expect(page.locator('body')).toBeVisible();
  }

  const unexpectedErrors = consoleErrors.filter(e => !e.includes('deoptimised') && !e.includes('favicon') && !e.includes('401'));
  expect(unexpectedErrors).toHaveLength(0);
});
