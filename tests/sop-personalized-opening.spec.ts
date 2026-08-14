import { test, expect } from '@playwright/test';

test.describe('SOP Personalized Spoken Opening & Real Transcript', () => {
  test('verifies live ElevenLabs signed URL route and initiation payload format', async ({ request }) => {
    const res = await request.get('http://localhost:3049/api/elevenlabs/signed-url', {
      headers: { 'x-workspace-id': 'nest-realty-wilmington' }
    });

    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.connectionType).toBe('websocket');
    expect(data.signedUrl).toContain('wss://api.elevenlabs.io');
    expect(data.signedUrl).not.toContain('undefined');
  });

  test('verifies transcript is not prefilled before ElevenLabs sends message', async ({ page }) => {
    await page.goto('http://localhost:3049/app/sops?subtab=today');
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("Create New SOP"), button:has-text("Build an SOP")');
    await expect(page.locator('h2:has-text("Build an SOP together")')).toBeVisible();

    // Before starting session, transcript container displays pre-start helper text
    const initialText = await page.locator('div:has-text("I’ll ask one question at a time")').first().innerText();
    expect(initialText).toContain('I’ll ask one question at a time');
    expect(initialText).not.toContain('Hello, how can I help you today?');
  });
});
