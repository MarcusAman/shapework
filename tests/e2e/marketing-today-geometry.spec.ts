import { test, expect } from '@playwright/test';

test.describe('Melissa Today Workspace Geometry & Non-Overlapping Verification', () => {
  test('Wide Desktop (1600x900) - Full Width Shell & 7-Card Grid', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto('http://localhost:3049/app/marketing?subtab=today');

    await page.waitForFunction(() => !document.body.innerText.includes('Loading shapework'), { timeout: 15000 });
    const shell = page.locator('[data-testid="marketing-shell"]');
    await expect(shell).toBeVisible({ timeout: 10000 });

    // Secondary vertical rail is removed
    const secNav = page.locator('[data-testid="marketing-secondary-navigation"]');
    await expect(secNav).not.toBeVisible();

    // Top horizontal navigation row is visible
    const topNav = page.locator('[data-testid="marketing-top-navigation"]');
    await expect(topNav).toBeVisible();

    // Check main workspace section
    const todayView = page.locator('[data-testid="marketing-today-view"]');
    await expect(todayView).toBeVisible();
    const mainBox = await todayView.boundingBox();
    expect(mainBox).not.toBeNull();
    expect(mainBox!.width).toBeGreaterThanOrEqual(1000);

    // Check header layout (Title on left, Plan Tomorrow on right)
    const header = page.locator('[data-testid="marketing-today-header"]');
    await expect(header).toBeVisible();
    const planTomorrowBtn = header.locator('button:has-text("Plan Tomorrow")');
    await expect(planTomorrowBtn).toBeVisible();

    // Check 7 summary cards non-overlapping
    const summaryGrid = page.locator('[data-testid="marketing-summary-grid"]');
    await expect(summaryGrid).toBeVisible();
    const cards = summaryGrid.locator('> div');
    const cardCount = await cards.count();
    expect(cardCount).toBe(7);

    // Verify non-overlapping bounding boxes for summary cards
    const boxes = [];
    for (let i = 0; i < cardCount; i++) {
      const box = await cards.nth(i).boundingBox();
      expect(box).not.toBeNull();
      boxes.push(box!);
    }

    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const b1 = boxes[i];
        const b2 = boxes[j];
        const overlap = !(
          b1.x + b1.width <= b2.x ||
          b2.x + b2.width <= b1.x ||
          b1.y + b1.height <= b2.y ||
          b2.y + b2.height <= b1.y
        );
        expect(overlap).toBe(false);
      }
    }

    // Check priority filters row
    const filters = page.locator('[data-testid="marketing-priority-filters"]');
    await expect(filters).toBeVisible();

    // Check work queue filling full main width
    const queue = page.locator('[data-testid="marketing-work-queue"]');
    await expect(queue).toBeVisible();
    const queueBox = await queue.boundingBox();
    expect(queueBox!.width).toBeGreaterThanOrEqual(1000);
  });

  test('Compact Desktop (< 1100px, e.g. 960x800) - Full Width Shell', async ({ page }) => {
    await page.setViewportSize({ width: 960, height: 800 });
    await page.goto('http://localhost:3049/app/marketing?subtab=today');

    await page.waitForFunction(() => !document.body.innerText.includes('Loading shapework'), { timeout: 15000 });
    const shell = page.locator('[data-testid="marketing-shell"]');
    await expect(shell).toBeVisible({ timeout: 10000 });

    // Secondary vertical rail is removed
    const secNav = page.locator('[data-testid="marketing-secondary-navigation"]');
    await expect(secNav).not.toBeVisible();

    // Top horizontal nav bar visible
    const topNav = page.locator('[data-testid="marketing-top-navigation"]');
    await expect(topNav).toBeVisible();

    // Today main section expands to available container width
    const todayView = page.locator('[data-testid="marketing-today-view"]');
    const mainBox = await todayView.boundingBox();
    expect(mainBox!.width).toBeGreaterThanOrEqual(600);
  });
});
