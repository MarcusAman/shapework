import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`[CONSOLE ${msg.type().toUpperCase()}] ${msg.text()}`);
    if (msg.type() === 'error') {
      const location = msg.location();
      console.log(`  at ${location.url}:${location.lineNumber}:${location.columnNumber}`);
    }
  });

  page.on('pageerror', err => {
    console.log(`[PAGE ERROR] ${err.stack || err.message}`);
  });

  try {
    console.log('Navigating to http://localhost:3000/app/command-center...');
    await page.goto('http://localhost:3000/app/command-center', { timeout: 10000 });
    
    // Fill password passcode if visible
    const passcode = page.locator('input[type="password"]');
    await passcode.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    if (await passcode.isVisible()) {
      console.log('Passcode gate visible. Submitting passcode...');
      await passcode.fill('shapework2026');
      await page.click('button[type="submit"]');
      console.log('Passcode submitted.');
    } else {
      console.log('Passcode gate not visible.');
    }

    // Wait a bit for React to render and potentially loop
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('Finished waiting.');
  } catch (err: any) {
    console.error('Navigation or test error:', err.message);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
