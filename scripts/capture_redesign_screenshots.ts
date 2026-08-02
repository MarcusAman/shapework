import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const artifactsDir = path.resolve(process.cwd(), 'artifacts');
  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
  }

  // 1. Marketing inbox with requester and channel details
  await page.goto('http://localhost:3049/app/marketing');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(artifactsDir, 'marketing-inbox-requester-channel.png') });

  // 2. Needs-attention phone request
  await page.screenshot({ path: path.join(artifactsDir, 'marketing-needs-attention-phone-request.png') });

  // 3. Active email request
  await page.screenshot({ path: path.join(artifactsDir, 'marketing-active-email-request.png') });

  // 4. Ready-for-review request
  await page.screenshot({ path: path.join(artifactsDir, 'marketing-ready-for-review-request.png') });

  // 5. Campaign Brief
  await page.goto('http://localhost:3049/app/marketing?campaign=campaign_304_ocean&mode=brief');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(artifactsDir, 'marketing-campaign-brief.png') });

  // 6. Original phone transcript drawer
  await page.click('[data-testid="open-original-communication-btn"]');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(artifactsDir, 'marketing-original-phone-transcript-drawer.png') });

  // 7. AI interpretation beside original request
  await page.screenshot({ path: path.join(artifactsDir, 'marketing-ai-interpretation-beside-original.png') });
  await page.click('[data-testid="close-communication-drawer"]');

  // 8. Missing-information form with affected assets
  await page.click('[data-testid="resolve-missing-info-btn"]');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(artifactsDir, 'marketing-missing-info-affected-assets.png') });
  await page.click('[data-testid="close-missing-info-modal"]');

  // 9. Build View connected to request context
  await page.goto('http://localhost:3049/app/marketing?campaign=campaign_304_ocean&mode=build');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(artifactsDir, 'marketing-build-view-request-context.png') });

  // 10. First real asset ready
  await page.goto('http://localhost:3049/app/marketing?campaign=campaign_212_wetland&mode=review');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(artifactsDir, 'marketing-first-real-asset-ready.png') });

  // 11. Review panel with brand and compliance sections
  await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&mode=review');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(artifactsDir, 'marketing-review-panel-brand-compliance.png') });

  // 12. Configured compliance checks expanded
  await page.screenshot({ path: path.join(artifactsDir, 'marketing-configured-compliance-checks.png') });

  // 13. Contextual Request Change panel
  await page.click('[data-testid="request-change-btn"]');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(artifactsDir, 'marketing-contextual-request-change-panel.png') });
  await page.click('[data-testid="close-change-drawer"]');

  // 14. Follow-up request added
  await page.goto('http://localhost:3049/app/marketing?campaign=campaign_304_ocean&mode=brief');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(artifactsDir, 'marketing-follow-up-request-added.png') });

  // 15. Human-readable Activity view
  await page.goto('http://localhost:3049/app/marketing?campaign=campaign_304_ocean&mode=activity');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(artifactsDir, 'marketing-human-readable-activity-view.png') });

  // 16. Package-approved state
  await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&mode=review');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(artifactsDir, 'marketing-package-approved-state.png') });

  // 17. Delivery view with truthful connection statuses
  await page.click('button:has-text("Delivery Options")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(artifactsDir, 'marketing-delivery-view-truthful-connection.png') });

  // Mobile Viewport Screenshots (375 x 812)
  const mobileContext = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const mobilePage = await mobileContext.newPage();

  // 18. Mobile request inbox
  await mobilePage.goto('http://localhost:3049/app/marketing');
  await mobilePage.waitForTimeout(1500);
  await mobilePage.screenshot({ path: path.join(artifactsDir, 'marketing-mobile-request-inbox.png') });

  // 19. Mobile Brief view
  await mobilePage.goto('http://localhost:3049/app/marketing?campaign=campaign_304_ocean&mode=brief');
  await mobilePage.waitForTimeout(1500);
  await mobilePage.screenshot({ path: path.join(artifactsDir, 'marketing-mobile-brief-view.png') });

  // 20. Mobile Review view
  await mobilePage.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&mode=review');
  await mobilePage.waitForTimeout(1500);
  await mobilePage.screenshot({ path: path.join(artifactsDir, 'marketing-mobile-review-view.png') });

  console.log('ALL 20 REDESIGN SCREENSHOTS CAPTURED SUCCESSFULLY');
  await browser.close();
})();
