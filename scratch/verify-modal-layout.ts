import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function main() {
  const PORT = '3000'; // Target the running dev server
  const screenshotPath = path.join(process.cwd(), 'screenshots', 'live-org-chart-wizard.png');
  const artifactDir = '/Users/marcusaman/.gemini/antigravity/brain/42fe4afd-6266-484e-aed5-d4e02ef880a6';
  const artifactScreenshotPath = path.join(artifactDir, 'live-org-chart-wizard.png');

  if (!fs.existsSync(path.dirname(screenshotPath))) {
    fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
  }

  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log(`Navigating to http://localhost:${PORT}/login ...`);
  await page.goto(`http://localhost:${PORT}/login`);
  await page.fill('input[type="email"]', 'marcus@shapework.co');
  await page.fill('input[type="password"]', 'shapework2026');
  await page.click('button[type="submit"]');
  
  console.log('Waiting for workboard redirect...');
  await page.waitForURL(`**/app/workboard`);

  console.log('Navigating to settings...');
  await page.goto(`http://localhost:${PORT}/app/settings`);
  
  console.log('Waiting for settings tab to render...');
  await page.waitForSelector('h3:has-text("Workspace Profile")');

  console.log('Clicking Open Org Chart Wizard...');
  await page.click('button:has-text("Open Org Chart Wizard")');

  console.log('Waiting for modal to appear...');
  await page.waitForSelector('h2:has-text("Org Chart Wizard")');
  await page.waitForTimeout(2000); // Wait for transition animation

  console.log('Capturing screenshot...');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  fs.copyFileSync(screenshotPath, artifactScreenshotPath);
  console.log(`Screenshot saved to: ${screenshotPath}`);
  console.log(`Screenshot copied to artifact: ${artifactScreenshotPath}`);

  await browser.close();
}

main().catch(err => {
  console.error('Error during execution:', err);
  process.exit(1);
});
