import { test, expect } from '@playwright/test';

test.describe('Marketing Secondary Navigation End-to-End Test Suite', () => {
  test('all Marketing navigation views work cleanly', async ({ page }) => {
    // 1. Initial navigation to /app/marketing?subtab=requests
    await page.goto('http://localhost:3049/app/marketing?subtab=requests');
    await page.waitForFunction(() => !document.body.innerText.includes('Loading shapework'), { timeout: 15000 });

    const requestsNav = page.locator('[data-testid="marketing-nav-requests"]');
    await expect(requestsNav).toBeVisible({ timeout: 10000 });
    await expect(requestsNav).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('[data-testid="marketing-requests-view"]')).toBeVisible();

    // 2. Click Today (Melissa)
    await page.locator('[data-testid="marketing-nav-today"]').click();
    await expect(page).toHaveURL(/subtab=today/);
    await expect(page.locator('[data-testid="marketing-nav-today"]')).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('[data-testid="marketing-today-view"]')).toBeVisible();

    // 3. Click Workboard
    await page.locator('[data-testid="marketing-nav-workboard"]').click();
    await expect(page).toHaveURL(/subtab=workboard/);
    await expect(page.locator('[data-testid="marketing-nav-workboard"]')).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('[data-testid="marketing-workboard-view"]')).toBeVisible();

    // 4. Click VA Workspace
    await page.locator('[data-testid="marketing-nav-va"]').click();
    await expect(page).toHaveURL(/subtab=va/);
    await expect(page.locator('[data-testid="marketing-nav-va"]')).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('[data-testid="marketing-va-view"]')).toBeVisible();

    // 5. Click Intake Log
    await page.locator('[data-testid="marketing-nav-intake"]').click();
    await expect(page).toHaveURL(/subtab=intake/);
    await expect(page.locator('[data-testid="marketing-nav-intake"]')).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('[data-testid="marketing-intake-view"]')).toBeVisible();

    // 6. Click Templates
    await page.locator('[data-testid="marketing-nav-templates"]').click();
    await expect(page).toHaveURL(/subtab=templates/);
    await expect(page.locator('[data-testid="marketing-nav-templates"]')).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('[data-testid="marketing-templates-view"]')).toBeVisible();

    // 7. Test Browser Back and Forward History
    await page.goBack(); // returns to intake
    await expect(page).toHaveURL(/subtab=intake/);
    await expect(page.locator('[data-testid="marketing-intake-view"]')).toBeVisible();

    await page.goBack(); // returns to va
    await expect(page).toHaveURL(/subtab=va/);
    await expect(page.locator('[data-testid="marketing-va-view"]')).toBeVisible();

    await page.goBack(); // returns to workboard
    await expect(page).toHaveURL(/subtab=workboard/);

    await page.goBack(); // returns to today
    await expect(page).toHaveURL(/subtab=today/);

    await page.goBack(); // returns to requests
    await expect(page).toHaveURL(/subtab=requests/);

    await page.goForward(); // returns to today
    await expect(page).toHaveURL(/subtab=today/);
  });

  test('legacy subtab=campaigns normalizes to subtab=requests', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?subtab=campaigns');
    await page.waitForFunction(() => !document.body.innerText.includes('Loading shapework'), { timeout: 15000 });

    await expect(page).toHaveURL(/subtab=requests/);
    await expect(page.locator('[data-testid="marketing-nav-requests"]')).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('[data-testid="marketing-requests-view"]')).toBeVisible();
  });

  test('invalid subtab normalizes to safe requests default', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?subtab=unknown_invalid');
    await page.waitForFunction(() => !document.body.innerText.includes('Loading shapework'), { timeout: 15000 });

    await expect(page).toHaveURL(/subtab=requests/);
    await expect(page.locator('[data-testid="marketing-nav-requests"]')).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('[data-testid="marketing-requests-view"]')).toBeVisible();
  });

  test('direct URLs and page refresh persistence', async ({ page }) => {
    const tabs = ['today', 'requests', 'workboard', 'va', 'intake', 'templates'];
    for (const subtab of tabs) {
      await page.goto(`http://localhost:3049/app/marketing?subtab=${subtab}`);
      await page.waitForFunction(() => !document.body.innerText.includes('Loading shapework'), { timeout: 15000 });

      await expect(page.locator(`[data-testid="marketing-nav-${subtab}"]`)).toHaveAttribute('aria-current', 'page');
      await expect(page.locator(`[data-testid="marketing-${subtab}-view"]`)).toBeVisible();

      // Refresh page
      await page.reload();
      await page.waitForFunction(() => !document.body.innerText.includes('Loading shapework'), { timeout: 15000 });

      await expect(page.locator(`[data-testid="marketing-nav-${subtab}"]`)).toHaveAttribute('aria-current', 'page');
      await expect(page.locator(`[data-testid="marketing-${subtab}-view"]`)).toBeVisible();
    }
  });
});
