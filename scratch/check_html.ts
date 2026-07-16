import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://shapework-os-3xc3npf56a-uc.a.run.app/app');
  await page.waitForTimeout(3000);
  console.log('URL after navigation:', page.url());
  console.log('Title:', await page.title());
  const body = await page.evaluate(() => document.body.innerHTML);
  console.log('Body HTML length:', body.length);
  console.log('Body HTML snippet:', body.substring(0, 1000));
  await browser.close();
}

main().catch(console.error);
