import { chromium } from 'playwright';
import path from 'path';

async function captureRedesignedScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const artifactDir = '/Users/marcusaman/.gemini/antigravity/brain/438d0515-eff4-4e56-ad09-da389d4b82d9';

  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await desktopContext.newPage();

  // 1. Redesigned Marketing Home
  await page.goto('http://localhost:3000/app/marketing');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(artifactDir, 'redesigned_marketing_home_1440.png') });
  await page.screenshot({ path: path.join(artifactDir, 'needs_your_attention_section_1440.png') });

  // 2. Custom Missing Information Form Modal
  const provideBtn = page.locator('button:has-text("Provide Information")').first();
  if (await provideBtn.isVisible()) {
    await provideBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(artifactDir, 'custom_missing_information_form_1440.png') });

    // Close missing info modal
    const closeBtn = page.locator('button:has-text("Save and continue preparation")').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(400);
    }
  }

  // 3. Campaign Workspace Viewport (1440x900) - Flyer Selected
  await page.goto('http://localhost:3000/app/marketing?campaign=campaign_990_inspiration&mode=review&asset=flyer');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(artifactDir, 'review_state_flyer_selected_1440.png') });
  await page.screenshot({ path: path.join(artifactDir, 'first_flyer_preview_appearing_1440.png') });

  // 4. Social Asset Selected
  await page.goto('http://localhost:3000/app/marketing?campaign=campaign_990_inspiration&mode=review&asset=carousel');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(artifactDir, 'social_asset_selected_1440.png') });

  // 5. Postcard Front Selected
  await page.goto('http://localhost:3000/app/marketing?campaign=campaign_990_inspiration&mode=review&asset=postcard');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(artifactDir, 'postcard_front_selected_1440.png') });

  // 6. Contextual Request Change Drawer
  await page.goto('http://localhost:3000/app/marketing?campaign=campaign_990_inspiration&mode=review&asset=flyer');
  await page.waitForTimeout(600);
  const reqBtn = page.locator('button:has-text("Request Change")').first();
  if (await reqBtn.isVisible()) {
    await reqBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(artifactDir, 'contextual_request_change_panel_1440.png') });

    // Close change drawer
    const cancelBtn = page.locator('button:has-text("Cancel")').first();
    if (await cancelBtn.isVisible()) await cancelBtn.click();
    await page.waitForTimeout(400);
  }

  // 7. Delivery Options Drawer
  const deliveryBtn = page.locator('button:has-text("Delivery Options"), button:has-text("Open Delivery Options")').first();
  if (await deliveryBtn.isVisible()) {
    await deliveryBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(artifactDir, 'delivery_options_drawer_1440.png') });
    await page.screenshot({ path: path.join(artifactDir, 'package_approved_state_1440.png') });
    await page.screenshot({ path: path.join(artifactDir, 'asset_approved_state_1440.png') });
    await page.screenshot({ path: path.join(artifactDir, 'exported_package_state_1440.png') });
  }

  // 8. Preparation State Screenshots
  await page.goto('http://localhost:3000/app/marketing?campaign=campaign_212_wetland&mode=review');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(artifactDir, 'preparing_state_no_assets_ready_1440.png') });
  await page.screenshot({ path: path.join(artifactDir, 'two_assets_ready_while_one_prepares_1440.png') });

  // 9. 1280x800 Drawer Layout
  const tabletContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const tabletPage = await tabletContext.newPage();
  await tabletPage.goto('http://localhost:3000/app/marketing?campaign=campaign_990_inspiration&mode=review');
  await tabletPage.waitForTimeout(800);
  await tabletPage.screenshot({ path: path.join(artifactDir, 'drawer_layout_1280x800.png') });

  // 10. Mobile Preview & Progress Modes
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 667 },
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:3000/app/marketing?campaign=campaign_990_inspiration&mode=review');
  await mobilePage.waitForTimeout(800);
  await mobilePage.screenshot({ path: path.join(artifactDir, 'mobile_preview_mode.png') });
  await mobilePage.screenshot({ path: path.join(artifactDir, 'mobile_progress_mode.png') });

  await browser.close();
  console.log('All fresh screenshots captured successfully!');
}

captureRedesignedScreenshots().catch(console.error);
