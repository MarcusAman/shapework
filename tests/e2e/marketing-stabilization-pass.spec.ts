import { test, expect } from '@playwright/test';
import { getGenerationJobFromStore } from '../../server/media/generationJobStore';

test.describe('Marketing Workspace Stabilization & Truth Acceptance Pass', () => {
  test('Backend job store does not synthesize completed jobs for unstarted job IDs', async () => {
    const job = getGenerationJobFromStore('job_unstarted_test_9999');
    expect(job).toBeNull();
  });

  test('Network request budget on Marketing page load is <= 15 requests', async ({ page }) => {
    const apiRequests: string[] = [];

    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('/api/') && !url.includes('/raw') && !url.includes('/assets/')) {
        apiRequests.push(url);
      }
    });

    await page.goto('http://localhost:3049/app/marketing');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    console.log(`[Network Budget Test] Total API requests captured: ${apiRequests.length}`, apiRequests);
    expect(apiRequests.length).toBeLessThanOrEqual(15);
  });

  test('Customer-facing TopBar header displays honest marketing wording', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing');
    await expect(page.locator('h1:has-text("Marketing")')).toBeVisible();
    await expect(page.locator('text=Requests and work handled by Shapework.')).toBeVisible();
  });

  test('Campaign workspace opens and renders successfully without hanging', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing');
    await page.waitForLoadState('networkidle');

    // Click Requests tab
    const requestsTab = page.locator('button:has-text("Requests")').first();
    await requestsTab.click();

    // Click campaign action button (View progress, Provide information, or Review package)
    const actionBtn = page.locator('[data-testid="btn-action-preparing"], [data-testid="btn-action-ready-for-review"], [data-testid="btn-action-needs-attention"]').first();
    await actionBtn.click();

    // Verify workspace renders campaign title header
    await expect(page.locator('[data-testid="workspace-campaign-title"]')).toBeVisible({ timeout: 10000 });
  });
});
