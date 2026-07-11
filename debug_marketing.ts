import { chromium } from '@playwright/test';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

async function main() {
  const PORT = '3044';
  
  // Clear local db.json to match E2E environment
  const dbPath = path.join(process.cwd(), 'data', 'db.json');
  if (fs.existsSync(dbPath)) {
    try {
      fs.unlinkSync(dbPath);
      console.log('Cleared existing db.json');
    } catch (e) {}
  }

  console.log('Starting test server...');
  const serverProcess = spawn('npx', ['tsx', 'server.ts'], {
    env: {
      ...process.env,
      APP_MODE: 'development',
      STORAGE_DRIVER: 'local',
      DEMO_PASSCODE: 'shapework2026',
      PORT
    }
  });

  serverProcess.stdout?.on('data', (data) => console.log('[Server STDOUT]', data.toString()));
  serverProcess.stderr?.on('data', (data) => console.error('[Server STDERR]', data.toString()));

  await new Promise((resolve) => setTimeout(resolve, 8000));

  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err));

  console.log('Navigating to page...');
  await page.goto(`http://localhost:${PORT}/app/marketing`);
  await page.waitForTimeout(3000);

  const passcode = page.locator('input[type="password"]');
  console.log('Checking passcode form visibility...');
  if (await passcode.isVisible()) {
    console.log('Passcode form is visible. Filling and submitting...');
    await passcode.fill('shapework2026');
    await page.click('button[type="submit"]');
  } else {
    console.log('Passcode form is NOT visible!');
  }

  console.log('Waiting for aside to be visible...');
  try {
    await page.locator('aside').first().waitFor({ state: 'visible', timeout: 10000 });
    console.log('SUCCESS: aside is visible!');
  } catch (err) {
    console.error('FAILED: aside did not become visible within 10 seconds.');
  }

  const screenshotPath = '/Users/marcusaman/.gemini/antigravity/brain/5c1766ce-367f-4b7b-a790-8f9f02ccd43a/debug_marketing_page.png';
  await page.screenshot({ path: screenshotPath });
  console.log(`Saved screenshot to ${screenshotPath}`);

  await browser.close();
  serverProcess.kill('SIGTERM');
  console.log('Done!');
}

main().catch(err => {
  console.error('Error in script:', err);
  process.exit(1);
});
