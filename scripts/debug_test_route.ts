import { chromium } from 'playwright';

async function testWorkspaceRoute() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/app/marketing?campaign=campaign_990_inspiration&mode=review');
  await page.waitForTimeout(2000);
  console.log('Body Text:', await page.locator('body').innerText());
  await browser.close();
}

testWorkspaceRoute().catch(console.error);
