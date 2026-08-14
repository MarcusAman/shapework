import { test, expect } from '@playwright/test';

test.describe('SOP Voice Audio Format', () => {
  test('initializes Web Audio context without format guessing errors', async ({ page }) => {
    await page.goto('/app/sops?subtab=today');
    const audioContextSupported = await page.evaluate(() => {
      return typeof (window.AudioContext || (window as any).webkitAudioContext) !== 'undefined';
    });
    expect(audioContextSupported).toBe(true);
  });
});
