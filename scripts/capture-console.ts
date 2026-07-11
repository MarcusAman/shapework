import { chromium } from '@playwright/test';

async function tryLogin(page: any, email: string) {
  await page.goto('http://localhost:3000/login', { timeout: 10000 });
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill('password123');
  await page.locator('button[type="submit"]').click();
  try {
    await page.waitForURL('**/app/command-center', { timeout: 4000 });
    return true;
  } catch (e) {
    return false;
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.addInitScript(() => {
    (window as any).__capturedErrors = [];
    const orig = console.error;
    console.error = function(...args) {
      orig.apply(console, args);
      (window as any).__capturedErrors.push(args.map(String));
    };
  });

  try {
    let success = await tryLogin(page, 'sarah.j@nestrealty.com');
    if (success) {
      console.log('Logged in successfully. Clicking Physical Assets tab...');
      const assetsButton = page.locator('button[aria-label="Physical Assets"]').first();
      await assetsButton.click();
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const captured = await page.evaluate(() => (window as any).__capturedErrors || []);
      console.log('Captured errors:');
      console.log(JSON.stringify(captured, null, 2));
    }
  } catch (err: any) {
    console.error('Test script error:', err.stack || err.message);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
