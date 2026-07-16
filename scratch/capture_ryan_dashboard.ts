import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const LOCAL_URL = 'http://localhost:3049';
const SESSION_VALUE = 'owner@nestrealty.com';
const OUTPUT_DIR = '/Users/marcusaman/.gemini/antigravity-ide/brain/b25ba157-da11-4af3-95df-7505a9b9d019/screenshots/ryan_pilot';

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('Launching browser...');
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
  await page.setViewportSize({ width: 1440, height: 900 });

  // Navigate to role-map with Wilmington workspace parameter
  console.log('Navigating to Role Map page with Wilmington workspace...');
  await page.goto(`${LOCAL_URL}/app/role-map?workspace=nest-realty-wilmington`);
  await page.waitForTimeout(6000);

  // Take screenshot of Overview
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01_overview.png') });
  console.log('Captured 01_overview.png');

  // Click on "Org Chart" tab
  console.log('Switching to Org Chart tab...');
  const orgChartTab = page.locator('button:has-text("Org Chart")');
  await orgChartTab.click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '02_org_chart.png') });
  console.log('Captured 02_org_chart.png');

  // Click on Jessica Keenan's card to inspect
  console.log('Clicking on Jessica Keenan card to inspect...');
  const jessicaCard = page.locator('div:has-text("Jessica Keenan")').last();
  if (await jessicaCard.isVisible()) {
    await jessicaCard.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '02_org_chart_jessica_inspected.png') });
    console.log('Captured 02_org_chart_jessica_inspected.png');

    // Click on SOP inside inspector panel
    console.log('Clicking on SOP link inside Jessica\'s inspector panel...');
    const sopLink = page.locator('button:has-text("Click to read document")').first();
    if (await sopLink.isVisible()) {
      await sopLink.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(OUTPUT_DIR, '02_org_chart_sop_modal.png') });
      console.log('Captured 02_org_chart_sop_modal.png');

      // Close the modal
      const closeModalBtn = page.locator('button:has-text("Close Document")');
      if (await closeModalBtn.isVisible()) {
        await closeModalBtn.click();
        await page.waitForTimeout(1000);
      }
    }
  }

  // Click on "By Position" tab
  console.log('Switching to By Position tab...');
  const byPositionTab = page.locator('button:has-text("By Position")');
  await byPositionTab.click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '03_by_position.png') });
  console.log('Captured 03_by_position.png');

  // Click on "Routing Matrix" tab
  console.log('Switching to Routing Matrix tab...');
  const routingMatrixTab = page.locator('button:has-text("Routing Matrix")');
  await routingMatrixTab.click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '04_routing_matrix.png') });
  console.log('Captured 04_routing_matrix.png');

  // Click on "Workflow" tab
  console.log('Switching to Workflow tab...');
  const workflowTab = page.locator('button:has-text("Workflow")');
  await workflowTab.click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '05_workflow.png') });
  console.log('Captured 05_workflow.png');

  // Click on "Escalations" tab
  console.log('Switching to Escalations tab...');
  const escalationsTab = page.locator('button:has-text("Escalations")');
  await escalationsTab.click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '06_escalations.png') });
  console.log('Captured 06_escalations.png');

  // Click on "SOPS & Knowledge" tab
  console.log('Switching to SOPS & Knowledge tab...');
  const sopsTab = page.locator('button:has-text("SOPS & Knowledge")');
  await sopsTab.click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '07_sops_knowledge.png') });
  console.log('Captured 07_sops_knowledge.png');

  // Click on "Connected Tools" tab
  console.log('Switching to Connected Tools tab...');
  const connectedToolsTab = page.locator('button:has-text("Connected Tools")');
  await connectedToolsTab.click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '08_connected_tools.png') });
  console.log('Captured 08_connected_tools.png');

  await browser.close();
  console.log('All screenshots captured successfully in:', OUTPUT_DIR);
}

main().catch(err => {
  console.error('Error running screenshot script:', err);
  process.exit(1);
});
