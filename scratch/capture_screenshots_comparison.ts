import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const PROD_URL = 'https://shapework-os-3xc3npf56a-ew.a.run.app';
const LOCAL_URL = 'http://localhost:3049';
const SESSION_VALUE = 'owner@nestrealty.com';
const OUTPUT_DIR = '/Users/marcusaman/.gemini/antigravity-ide/brain/b25ba157-da11-4af3-95df-7505a9b9d019/screenshots';

async function captureSite(baseUrl: string, prefix: string) {
  console.log(`Starting capture for ${baseUrl}...`);
  const browser = await chromium.launch({ headless: true });
  
  // Create context and inject authentication cookie
  const context = await browser.newContext();
  const domain = new URL(baseUrl).hostname;
  await context.addCookies([
    {
      name: 'shapework_session',
      value: SESSION_VALUE,
      domain: domain,
      path: '/'
    }
  ]);
  
  const page = await context.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });

  // Navigate directly to app route
  await page.goto(`${baseUrl}/app`);
  await page.waitForTimeout(6000); // Allow full bundle loading and state fetching

  console.log(`[${prefix}] URL: ${page.url()}`);

  // Capture Today/Workboard
  await page.screenshot({ path: path.join(OUTPUT_DIR, `${prefix}_workboard.png`) });
  console.log(`Captured ${prefix}_workboard.png`);

  // Navigate to Approvals
  await page.goto(`${baseUrl}/app/approvals`);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, `${prefix}_approvals.png`) });
  console.log(`Captured ${prefix}_approvals.png`);

  // Navigate to Integrations
  await page.goto(`${baseUrl}/app/integrations`);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, `${prefix}_integrations.png`) });
  console.log(`Captured ${prefix}_integrations.png`);

  // Navigate to Settings
  await page.goto(`${baseUrl}/app/settings`);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, `${prefix}_settings.png`) });
  console.log(`Captured ${prefix}_settings.png`);

  await browser.close();
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('Capturing production site...');
  await captureSite(PROD_URL, 'production').catch((err) => console.error('Error capturing production:', err));

  console.log('Capturing local site...');
  await captureSite(LOCAL_URL, 'local').catch((err) => console.error('Error capturing local:', err));

  console.log('Screenshot comparison capture finished!');
}

main().catch(err => {
  console.error('Error running comparison capture:', err);
  process.exit(1);
});
