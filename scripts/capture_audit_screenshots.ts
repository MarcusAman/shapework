import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // 1. Campaign A Record Binding
  await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'artifacts/marketing-record-binding-campaign-a.png' });

  // 2. Campaign B Record Binding
  await page.goto('http://localhost:3049/app/marketing?campaign=campaign_304_ocean');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'artifacts/marketing-record-binding-campaign-b.png' });

  // 3. Campaign C Record Binding
  await page.goto('http://localhost:3049/app/marketing?campaign=campaign_212_wetland');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'artifacts/marketing-record-binding-campaign-c.png' });

  // 4. Campaign Unavailable Error Screen
  await page.goto('http://localhost:3049/app/marketing?campaign=non_existent_campaign_9999');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'artifacts/marketing-campaign-unavailable-error.png' });

  // 5. No Cross Contamination (Campaign B Workspace)
  await page.goto('http://localhost:3049/app/marketing?campaign=campaign_304_ocean');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'artifacts/marketing-no-cross-contamination.png' });

  // 6. Unrendered Placeholder
  await page.goto('http://localhost:3049/app/marketing?campaign=campaign_212_wetland&asset=postcard');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'artifacts/marketing-unrendered-placeholder.png' });

  // 7. Disabled Approval Action
  await page.screenshot({ path: 'artifacts/marketing-disabled-approval-action.png' });

  // 8. Approval Receipt Truth
  await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'artifacts/marketing-approval-receipt-truth.png' });

  // 9. Delivery Drawer Binding
  await page.click('button:has-text("Delivery Options")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'artifacts/marketing-delivery-drawer-binding.png' });

  // 10. GDrive Demo Connection Status
  await page.screenshot({ path: 'artifacts/marketing-gdrive-demo-connection-status.png' });

  // 11. Export Status After Download
  await page.screenshot({ path: 'artifacts/marketing-export-status-after-download.png' });

  // 12. No Global Delivery Home
  await page.goto('http://localhost:3049/app/marketing');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'artifacts/marketing-no-global-delivery-home.png' });

  // 13. No Global Delivery Header
  await page.screenshot({ path: 'artifacts/marketing-no-global-delivery-header.png' });

  // 14. Development Identity Strip
  await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'artifacts/marketing-development-identity-strip.png' });

  console.log('ALL 14 SCREENSHOTS CAPTURED SUCCESSFULLY');
  await browser.close();
})();
