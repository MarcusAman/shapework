import { test, expect } from '@playwright/test';

test.describe('Marketing Shared Shell & Layout End-to-End Test Suite', () => {

  test('Shared shell geometry and layout metrics at 1600x900', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto('http://localhost:3049/app/marketing?subtab=requests');
    await page.waitForFunction(() => !document.body.innerText.includes('Loading shapework'), { timeout: 15000 });

    // 1. Shared Shell is visible
    const shell = page.locator('[data-testid="marketing-shell"]');
    await expect(shell).toBeVisible();

    // 2. Action button aligned right in top navigation row
    const actionBtn = page.locator('[data-testid="new-marketing-request-btn"]');
    await expect(actionBtn).toBeVisible();

    // 3. Top horizontal navigation row is visible
    const topNav = page.locator('[data-testid="marketing-top-navigation"]');
    await expect(topNav).toBeVisible();
    const topNavBox = await topNav.boundingBox();
    expect(topNavBox?.width).toBeGreaterThanOrEqual(900);

    // 4. No obsolete vertical navigation rail exists
    const secondaryNav = page.locator('[data-testid="marketing-secondary-navigation"]');
    await expect(secondaryNav).not.toBeVisible();

    // 5. Main view content width metrics
    const content = page.locator('[data-testid="marketing-view-content"]');
    await expect(content).toBeVisible();
    const contentBox = await content.boundingBox();
    expect(contentBox?.width).toBeGreaterThanOrEqual(1050);

    // 6. Requests feed & Today Overview width metrics
    const requestCard = page.locator('[data-testid="marketing-requests-view"]');
    await expect(requestCard).toBeVisible();

    // 7. No bottom dev bar by default
    const devStrip = page.locator('[data-testid="dev-identity-strip"]');
    await expect(devStrip).not.toBeVisible();
  });

  test('Explicit debug mode drawer with debug=1 parameter', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?subtab=requests&debug=1');
    await page.waitForFunction(() => !document.body.innerText.includes('Loading shapework'), { timeout: 15000 });

    const devStrip = page.locator('[data-testid="dev-identity-strip"]');
    await expect(devStrip).toBeVisible();
    await expect(devStrip).toContainText('Explicit Debug Mode');
  });

  test('Subtab view switching & horizontal navigation', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?subtab=today');
    await page.waitForFunction(() => !document.body.innerText.includes('Loading shapework'), { timeout: 15000 });

    await expect(page.locator('[data-testid="marketing-nav-today"]')).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('[data-testid="marketing-today-view"]')).toBeVisible();

    // Click Workboard
    await page.locator('[data-testid="marketing-nav-workboard"]').click();
    await expect(page).toHaveURL(/subtab=workboard/);
    await expect(page.locator('[data-testid="marketing-nav-workboard"]')).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('[data-testid="marketing-workboard-view"]')).toBeVisible();

    // Click VA Workspace
    await page.locator('[data-testid="marketing-nav-va"]').click();
    await expect(page).toHaveURL(/subtab=va/);
    await expect(page.locator('[data-testid="marketing-nav-va"]')).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('[data-testid="marketing-va-view"]')).toBeVisible();

    // Click Intake Log
    await page.locator('[data-testid="marketing-nav-intake"]').click();
    await expect(page).toHaveURL(/subtab=intake/);
    await expect(page.locator('[data-testid="marketing-nav-intake"]')).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('[data-testid="marketing-intake-view"]')).toBeVisible();

    // Click Templates
    await page.locator('[data-testid="marketing-nav-templates"]').click();
    await expect(page).toHaveURL(/subtab=templates/);
    await expect(page.locator('[data-testid="marketing-nav-templates"]')).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('[data-testid="marketing-templates-view"]')).toBeVisible();
  });

  test('VA Workspace light mist empty state', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?subtab=va');
    await page.waitForFunction(() => !document.body.innerText.includes('Loading shapework'), { timeout: 15000 });

    const vaEmptyState = page.locator('[data-testid="va-empty-state"]');
    await expect(vaEmptyState).toBeVisible();
    await expect(vaEmptyState).toContainText('No work assigned to Maria');
    await expect(vaEmptyState).toContainText('Maria is currently certified for');
  });

  test('Templates visual preview grid cards', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?subtab=templates');
    await page.waitForFunction(() => !document.body.innerText.includes('Loading shapework'), { timeout: 15000 });

    const templatesView = page.locator('[data-testid="marketing-templates-view"]');
    await expect(templatesView).toBeVisible();
    await expect(templatesView).toContainText('Approved templates');
    await expect(templatesView).toContainText('Nest Editorial Property Flyer');
    await expect(templatesView).toContainText('Social Media Carousel Package');
    await expect(templatesView).toContainText('Direct Mail Glossy Postcard');
  });
});
