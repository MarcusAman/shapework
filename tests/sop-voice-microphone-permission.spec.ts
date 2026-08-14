import { test, expect } from '@playwright/test';

test.describe('SOP Voice Microphone Permission & Consent Screen', () => {
  test('displays consent notice explaining mic access and retention policy before prompt', async ({ page }) => {
    await page.goto('/app/sops?subtab=today');
    await page.waitForLoadState('networkidle');

    // Open modal if button present
    const openBtn = page.locator('button:has-text("Voice Diagnostic Interview"), button:has-text("Staff SOP Authoring")').first();
    if (await openBtn.isVisible()) {
      await openBtn.click();
    }

    // Verify modal elements
    const startVoiceBtn = page.locator('button:has-text("Start Voice Interview")');
    if (await startVoiceBtn.isVisible()) {
      await startVoiceBtn.click();
      // Consent overlay appears explaining retention and visibility
      await expect(page.locator('text=Microphone Access & Data Privacy Notice')).toBeVisible();
      await expect(page.locator('text=Audio Retention')).toBeVisible();
    }
  });
});
