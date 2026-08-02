import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR CONSOLE:', msg.text());
    }
  });
  page.on('pageerror', err => console.log('PAGE UNCAUGHT ERROR:', err.stack || err.message));
  
  await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration');
  await page.waitForTimeout(2000);

  await browser.close();
})();
