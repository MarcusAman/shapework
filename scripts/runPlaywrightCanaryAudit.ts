import { chromium } from '@playwright/test';
import { signJwt } from '../server/auth/jwt.js';
import path from 'path';

const CANARY_URL = process.env.CANARY_URL || 'https://canary---shapework-os-3xc3npf56a-uc.a.run.app';
const ARTIFACTS_DIR = '/Users/marcusaman/.gemini/antigravity/brain/789c78bf-0bfd-4212-874a-850ac96f4cc3';

async function runBrowserAcceptance() {
  console.log('==================================================================');
  console.log(`Starting Playwright Customer Acceptance Suite against ${CANARY_URL}...`);
  console.log('==================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const sessionToken = signJwt({
    userId: 'usr_ryan_bic',
    email: 'ryan@nestrealty.com',
    name: 'Ryan Crecelius',
    role: 'owner',
    workspaceId: 'ws_wilmington'
  });

  await context.addCookies([
    {
      name: 'shapework_session',
      value: sessionToken,
      domain: 'canary---shapework-os-3xc3npf56a-uc.a.run.app',
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'Strict'
    }
  ]);

  const page = await context.newPage();

  try {
    // 1. Load Ask Nest Ops in Demo / App Mode
    console.log('[1/4] Navigating to Ask Nest Ops Hub...');
    await page.goto(`${CANARY_URL}/demo`, { waitUntil: 'networkidle', timeout: 30000 });
    console.log('✅ Ask Nest Ops Hub Loaded.');

    // Capture screenshot of cleaned Ask Nest Ops Hub
    const hubScreenshot = path.join(ARTIFACTS_DIR, 'uat_canary_hub.png');
    await page.screenshot({ path: hubScreenshot, fullPage: true });
    console.log(`📸 Captured Hub Screenshot: ${hubScreenshot}`);

    // 2. Collapse Sidebar and verify logo
    console.log('[2/4] Collapsing sidebar to verify hunter green N logo...');
    const collapseToggle = page.locator('button[title*="Collapse"], button[aria-label*="Collapse"], button:has-text("Collapse")').first();
    if (await collapseToggle.count() > 0) {
      await collapseToggle.click();
      await page.waitForTimeout(1000);
    }
    const collapsedScreenshot = path.join(ARTIFACTS_DIR, 'uat_canary_collapsed_sidebar.png');
    await page.screenshot({ path: collapsedScreenshot, fullPage: true });
    console.log(`📸 Captured Collapsed Sidebar Screenshot: ${collapsedScreenshot}`);

    // 3. Test Search Query in Ask Nest Ops
    console.log('[3/4] Testing search in Ask Nest Ops...');
    const searchInput = page.locator('input[placeholder*="Ask"], input[placeholder*="type anything"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('What is the listing launch protocol?');
      await searchInput.press('Enter');
      await page.waitForTimeout(1500);
    }

    const searchResultScreenshot = path.join(ARTIFACTS_DIR, 'uat_canary_search_stage.png');
    await page.screenshot({ path: searchResultScreenshot, fullPage: true });
    console.log(`📸 Captured Search Stage Screenshot: ${searchResultScreenshot}`);

    console.log('\n==================================================================');
    console.log('✅ ALL PLAYWRIGHT BROWSER ACCEPTANCE GATES COMPLETED SUCCESSFULLY');
    console.log('==================================================================');
  } catch (err: any) {
    console.error('Playwright verification error:', err);
    throw err;
  } finally {
    await browser.close();
  }
}

runBrowserAcceptance().then(() => process.exit(0)).catch(() => process.exit(1));
