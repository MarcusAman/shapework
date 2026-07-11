import { chromium } from '@playwright/test';
const BASE_URL = 'http://localhost:3000';

async function debug() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  console.log('Navigating to /app...');
  await page.goto(`${BASE_URL}/app`);
  await page.waitForTimeout(2000);
  console.log('Current URL:', page.url());
  
  const content = await page.content();
  console.log('HTML Length:', content.length);
  
  const hasPasscode = await page.locator('input[type="password"]').isVisible();
  console.log('Has passcode field:', hasPasscode);
  
  if (hasPasscode) {
    await page.locator('input[type="password"]').fill('shapework2026');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    console.log('After submit URL:', page.url());
    console.log('After submit body text:', await page.locator('body').innerText());
  }
  
  await browser.close();
}

debug().catch(console.error);
