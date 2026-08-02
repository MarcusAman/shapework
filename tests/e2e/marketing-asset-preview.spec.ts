import { test, expect } from '@playwright/test';

test.describe('Marketing Asset Preview & Canvas Controls', () => {
  test('left rail asset selection updates center canvas preview', async ({ page }) => {
    await page.goto('/app/marketing?campaign=campaign_990_inspiration&mode=review&asset=flyer');
    await page.waitForLoadState('networkidle');

    // Default asset is Property Flyer
    await expect(page.locator('text=Property Flyer Proof')).toBeVisible();

    // Click Social Package in left rail
    await page.click('button:has-text("Social Package")');
    await expect(page.locator('text=Social Package Proof')).toBeVisible();
    await expect(page).toHaveURL(/.*asset=carousel.*/);

    // Click Direct Postcard in left rail
    await page.click('button:has-text("Direct Postcard")');
    await expect(page.locator('text=Direct Postcard Proof')).toBeVisible();
    await expect(page).toHaveURL(/.*asset=postcard.*/);
  });

  test('postcard front/back tab switching toggles page view', async ({ page }) => {
    await page.goto('/app/marketing?campaign=campaign_990_inspiration&mode=review&asset=postcard');
    await page.waitForLoadState('networkidle');

    // Verify Front/Back buttons
    await expect(page.locator('button:has-text("Front")')).toBeVisible();
    await expect(page.locator('button:has-text("Back")')).toBeVisible();

    await page.click('button:has-text("Back")');
    // Front/Back state toggles without page reload
    await expect(page.locator('button:has-text("Back")')).toHaveClass(/bg-[#176457]/);
  });

  test('full screen proof modal opens and closes', async ({ page }) => {
    await page.goto('/app/marketing?campaign=campaign_990_inspiration&mode=review&asset=flyer');
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("Full Screen")');
    await expect(page.locator('text=Full-Screen Proof')).toBeVisible();

    await page.click('button:has-text("✕")');
    await expect(page.locator('text=Full-Screen Proof')).not.toBeVisible();
  });
});
