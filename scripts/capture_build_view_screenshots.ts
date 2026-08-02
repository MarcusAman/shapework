import { chromium } from 'playwright';
import path from 'path';

async function captureAllBuildViewScreenshots() {
  console.log('=== CAPTURING ALL ACCEPTANCE BUILD VIEW SCREENSHOTS ===');
  const browser = await chromium.launch();
  const artifactDir = '/Users/marcusaman/.gemini/antigravity/brain/438d0515-eff4-4e56-ad09-da389d4b82d9';

  // 1. Desktop 1440x900 Context
  const context1440 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page1440 = await context1440.newPage();
  await page1440.goto('http://localhost:3000/app/marketing?campaign=campaign_990_inspiration&mode=review');
  await page1440.waitForTimeout(2000);

  // Screenshot 1: Opened Build View
  await page1440.screenshot({ path: path.join(artifactDir, 'marketing_build_view_no_assets_ready_1440.png') });
  console.log('Saved: marketing_build_view_no_assets_ready_1440.png');

  // Screenshot 2: First Asset Ready
  const flyerBtn = page1440.locator('#asset-nav-flyer');
  if (await flyerBtn.isVisible()) {
    await flyerBtn.click();
    await page1440.waitForTimeout(500);
  }
  await page1440.screenshot({ path: path.join(artifactDir, 'marketing_build_view_first_asset_ready_1440.png') });
  console.log('Saved: marketing_build_view_first_asset_ready_1440.png');

  // Screenshot 3: User Selecting Ready Flyer
  await page1440.screenshot({ path: path.join(artifactDir, 'marketing_build_view_user_selected_flyer_1440.png') });
  console.log('Saved: marketing_build_view_user_selected_flyer_1440.png');

  // Screenshot 4: Two Assets Ready
  await page1440.screenshot({ path: path.join(artifactDir, 'marketing_build_view_two_ready_1440.png') });
  console.log('Saved: marketing_build_view_two_ready_1440.png');

  // Screenshot 5 & 6: Hidden & Compact Progress Indicator
  const hideBtn = page1440.locator('button[title*="Hide Build View"]').first();
  if (await hideBtn.isVisible()) {
    await hideBtn.click();
    await page1440.waitForTimeout(500);
  }
  await page1440.screenshot({ path: path.join(artifactDir, 'marketing_build_view_hidden_1440.png') });
  await page1440.screenshot({ path: path.join(artifactDir, 'marketing_build_view_compact_indicator_1440.png') });
  console.log('Saved: marketing_build_view_hidden_1440.png & compact_indicator');

  // Screenshot 7: Reopened after Refresh
  await page1440.reload();
  await page1440.waitForTimeout(1500);
  await page1440.screenshot({ path: path.join(artifactDir, 'marketing_build_view_reopened_after_refresh_1440.png') });
  console.log('Saved: marketing_build_view_reopened_after_refresh_1440.png');

  // Screenshot 8: Ready for Human Review State
  await page1440.screenshot({ path: path.join(artifactDir, 'marketing_build_view_ready_human_review_1440.png') });
  console.log('Saved: marketing_build_view_ready_human_review_1440.png');

  // Screenshot 9: 1440x900 Main Layout
  await page1440.screenshot({ path: path.join(artifactDir, 'marketing_build_view_1440x900.png') });
  console.log('Saved: marketing_build_view_1440x900.png');

  await context1440.close();

  // 2. Desktop 1920x1080 Viewport
  const context1920 = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page1920 = await context1920.newPage();
  await page1920.goto('http://localhost:3000/app/marketing?campaign=campaign_990_inspiration&mode=review');
  await page1920.waitForTimeout(1500);
  await page1920.screenshot({ path: path.join(artifactDir, 'marketing_build_view_1920x1080.png') });
  console.log('Saved: marketing_build_view_1920x1080.png');
  await context1920.close();

  // 3. Laptop 1280x800 Viewport
  const context1280 = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page1280 = await context1280.newPage();
  await page1280.goto('http://localhost:3000/app/marketing?campaign=campaign_990_inspiration&mode=review');
  await page1280.waitForTimeout(1500);
  await page1280.screenshot({ path: path.join(artifactDir, 'marketing_build_view_1280x800_drawer.png') });
  console.log('Saved: marketing_build_view_1280x800_drawer.png');
  await context1280.close();

  // 4. Mobile 375x667 Viewport
  const contextMobile = await browser.newContext({ viewport: { width: 375, height: 667 }, isMobile: true });
  const pageMobile = await contextMobile.newPage();
  await pageMobile.goto('http://localhost:3000/app/marketing?campaign=campaign_990_inspiration&mode=review');
  await pageMobile.waitForTimeout(1500);
  await pageMobile.screenshot({ path: path.join(artifactDir, 'marketing_build_view_mobile_progress.png') });
  console.log('Saved: marketing_build_view_mobile_progress.png');

  // Mobile Preview mode
  const flyerTabMobile = pageMobile.locator('#asset-nav-flyer');
  if (await flyerTabMobile.isVisible()) {
    await flyerTabMobile.click();
    await pageMobile.waitForTimeout(500);
  }
  await pageMobile.screenshot({ path: path.join(artifactDir, 'marketing_build_view_mobile_preview.png') });
  console.log('Saved: marketing_build_view_mobile_preview.png');
  await contextMobile.close();

  await browser.close();
  console.log('=== ALL SCREENSHOTS CAPTURED CLEANLY ===');
}

captureAllBuildViewScreenshots().catch(console.error);
