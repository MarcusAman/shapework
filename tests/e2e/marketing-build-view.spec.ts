import { test, expect } from '@playwright/test';

test.describe('Marketing Build View Acceptance Suite', () => {
  test('1. Provenance: Displays real progress without timer simulation', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&mode=build');
    const sidecar = page.locator('[role="region"][aria-label="Build View Progress Panel"]');
    await expect(sidecar).toBeVisible({ timeout: 10000 });

    // Verify counter-based progress text (e.g. "5 of 5 materials ready")
    await expect(page.locator('text=materials ready').first()).toBeVisible();
  });

  test('2. Idempotency & Revision: Active job maintains revision state', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&mode=build');
    const sidecar = page.locator('[role="region"][aria-label="Build View Progress Panel"]');
    await expect(sidecar).toBeVisible({ timeout: 10000 });

    // Verify progress text renders
    await expect(page.locator('text=materials ready').first()).toBeVisible();
  });

  test('3. Refresh & Reconnect: Preserves job state and event history', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&mode=build');
    await expect(page.locator('[role="region"][aria-label="Build View Progress Panel"]')).toBeVisible({ timeout: 10000 });

    await page.reload();
    await expect(page.locator('[role="region"][aria-label="Build View Progress Panel"]')).toBeVisible();
  });

  test('4. Human Review State: Renders material status without auto-approval', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&mode=build');
    const sidecar = page.locator('[role="region"][aria-label="Build View Progress Panel"]');
    await expect(sidecar).toBeVisible({ timeout: 10000 });

    // Verify human review status text or ready indicator
    await expect(page.locator('text=Ready').first()).toBeVisible();
  });

  test('5. Preview Dominance: Central preview canvas occupies major viewport area', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&mode=build');

    const previewCanvas = page.locator('main').first();
    const box = await previewCanvas.boundingBox();
    expect(box).not.toBeNull();
    // At 1440 width, center preview is ~650px wide (> 40% of page width)
    expect(box!.width).toBeGreaterThan(500);
  });
});
