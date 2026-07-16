import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const LOCAL_URL = 'http://localhost:3049';
const SESSION_VALUE = 'ryan@nestrealty.com';
const OUTPUT_DIR = '/Users/marcusaman/.gemini/antigravity-ide/brain/b25ba157-da11-4af3-95df-7505a9b9d019/screenshots';

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log(`Starting capture for Ryan Pilot on ${LOCAL_URL}...`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const domain = new URL(LOCAL_URL).hostname;

  await context.addCookies([
    {
      name: 'shapework_session',
      value: SESSION_VALUE,
      domain: domain,
      path: '/'
    }
  ]);

  const page = await context.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  await page.setViewportSize({ width: 1280, height: 800 });

  // Navigate directly to app route with workspace query parameter
  console.log('Navigating to app role-map...');
  await page.goto(`${LOCAL_URL}/app/role-map?workspace=nest-realty-wilmington`);
  await page.waitForTimeout(6000); // Allow full bundle loading and state fetching

  console.log(`Current URL: ${page.url()}`);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'ryan_role_map.png') });
  console.log('Captured ryan_role_map.png');

  // Attempt to navigate to workboard to test redirect
  console.log('Navigating to workboard to test redirect...');
  await page.goto(`${LOCAL_URL}/app/workboard`);
  await page.waitForTimeout(4000);

  console.log(`Current URL after redirect: ${page.url()}`);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'ryan_after_workboard_redirect.png') });
  console.log('Captured ryan_after_workboard_redirect.png');

  await browser.close();
  console.log('Finished capturing screenshots!');
}

main().catch(err => {
  console.error('Error running capture:', err);
  process.exit(1);
});
