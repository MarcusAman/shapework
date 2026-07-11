import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';
const screenshotDir = path.resolve('docs/audit/post-polish-ui-screenshots');

if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function takeScreenshots() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  console.log('Navigating to /app...');
  await page.goto(`${BASE_URL}/app`);
  await page.waitForTimeout(2000);

  // If passcode is visible, log in
  const passcode = page.locator('input[type="password"]');
  if (await passcode.isVisible()) {
    console.log('Logging in with passcode...');
    await passcode.fill('shapework2026');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2500);
  }

  const tabs = [
    { name: 'command-center', label: 'Command Center' },
    { name: 'work-queue', label: 'Work Queue' },
    { name: 'operating-record', label: 'Operating Record' },
    { name: 'opportunities', label: 'Opportunities' },
    { name: 'workflows', label: 'Workflows' },
    { name: 'transactions', label: 'Transactions' },
    { name: 'people', label: 'People & Roles' },
    { name: 'integrations', label: 'Integrations' },
    { name: 'audit', label: 'Audit' },
    { name: 'settings', label: 'Settings' }
  ];

  for (const tab of tabs) {
    console.log(`Clicking tab: ${tab.label}`);
    try {
      const btn = page.locator(`button[aria-label="${tab.label}"]`).first();
      if (await btn.isVisible()) {
        await btn.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(screenshotDir, `${tab.name}.png`), fullPage: false });
      } else {
        // Fallback to text matching
        const textBtn = page.locator(`button:has-text("${tab.label}")`).first();
        if (await textBtn.isVisible()) {
          await textBtn.click();
          await page.waitForTimeout(2000);
          await page.screenshot({ path: path.join(screenshotDir, `${tab.name}.png`), fullPage: false });
        } else {
          console.warn(`Tab button not found for: ${tab.label}`);
          // Take screenshot anyway to see what is on screen
          await page.screenshot({ path: path.join(screenshotDir, `${tab.name}_failed.png`) });
        }
      }
    } catch (e) {
      console.error(`Failed to capture ${tab.name}:`, e);
    }
  }

  console.log('All screenshots completed successfully!');
  await browser.close();
}

takeScreenshots().catch(console.error);
