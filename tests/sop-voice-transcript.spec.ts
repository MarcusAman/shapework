import { test, expect } from '@playwright/test';

test.describe('SOP Voice Transcript', () => {
  test('renders user and AI transcript entries in left panel stream', async ({ page }) => {
    await page.goto('/app/sops?subtab=today');
    await page.waitForLoadState('networkidle');
  });
});
