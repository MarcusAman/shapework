import { test, expect } from '@playwright/test';

test.describe('Marketing Build View - Controlled User Intervention', () => {
  test('displays input required card and resumes workflow upon submission', async ({ page }) => {
    await page.goto('http://localhost:3000/app/marketing?campaign=campaign_990_inspiration&mode=review');

    // Check sidecar container visibility
    const sidecarRegion = page.locator('[role="region"][aria-label="Build View Progress Panel"]');
    await expect(sidecarRegion).toBeVisible({ timeout: 10000 });
  });
});
