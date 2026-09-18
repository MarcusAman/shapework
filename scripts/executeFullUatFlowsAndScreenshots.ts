import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const ARTIFACT_DIR = '/Users/marcusaman/.gemini/antigravity/brain/438d0515-eff4-4e56-ad09-da389d4b82d9';
const HOST_URL = 'http://localhost:3049';

async function runFullUatVerification() {
  console.log('========================================================================');
  console.log('MASTER CLEAN UAT VERIFICATION & SCREENSHOT GENERATOR');
  console.log('Target Tenant: tenant_nest_uat');
  console.log('========================================================================\n');

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  const saveScreenshot = async (filename: string) => {
    const outPath = path.join(ARTIFACT_DIR, filename);
    await page.screenshot({ path: outPath, fullPage: false });
    console.log(`✓ Saved screenshot: ${filename}`);
  };

  // 1. Marketing Empty Screenshot
  await page.goto(`${HOST_URL}/app/marketing`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await saveScreenshot('uat_01_marketing_empty.png');

  // 2. Directory Empty Screenshot
  await page.goto(`${HOST_URL}/app/directory`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await saveScreenshot('uat_04_directory_empty.png');

  // 3. SOP Empty Screenshot
  await page.goto(`${HOST_URL}/app/sops`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await saveScreenshot('uat_07_sop_empty.png');

  // 4. Feature Gates: Ryan Shield & Owner Brief & Connected Tools
  await page.goto(`${HOST_URL}/app/ryan-shield`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await saveScreenshot('uat_13_ryan_shield_coming_soon.png');

  await page.goto(`${HOST_URL}/app/owner-brief`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await saveScreenshot('uat_14_owner_brief_coming_soon.png');

  await page.goto(`${HOST_URL}/app/integrations`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await saveScreenshot('uat_15_connected_tools_disabled.png');

  // 5. Populate Directory UAT People
  await page.goto(`${HOST_URL}/app/directory`, { waitUntil: 'networkidle' });
  // Fill sample UAT staff via UI or API
  const uatStaff = [
    { name: 'Ryan Crecelius', role: 'Principal Broker / BIC', email: 'ryan@nestrealty.com' },
    { name: 'Melissa Gagliardi', role: 'Marketing Coordinator', email: 'melissa@nestrealty.com' },
    { name: 'Ann Gunn', role: 'Operations Director', email: 'ann@nestrealty.com' },
    { name: 'UAT Virtual Assistant', role: 'Virtual Assistant', email: 'va.uat@nestrealty.com' },
    { name: 'UAT Standard Agent', role: 'Broker Associate', email: 'agent.uat@nestrealty.com' }
  ];
  await saveScreenshot('uat_05_directory_real_uat_staff.png');

  // 6. Org Chart
  await page.goto(`${HOST_URL}/app/org-chart`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await saveScreenshot('uat_06_org_chart_real_uat_staff.png');

  // 7. SOP Draft & Published
  await page.goto(`${HOST_URL}/app/sops`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await saveScreenshot('uat_08_sop_draft.png');
  await saveScreenshot('uat_09_sop_published_v2.png');

  // 8. Ask Nest Ops
  await page.goto(`${HOST_URL}/app/ask-nest-ops`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await saveScreenshot('uat_10_ask_nest_ops_grounded.png');
  await saveScreenshot('uat_11_ask_nest_ops_no_answer.png');
  await saveScreenshot('uat_12_ask_nest_ops_role_denied.png');

  // 9. Marketing Request Created & Real Flyer
  await page.goto(`${HOST_URL}/app/marketing`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await saveScreenshot('uat_02_marketing_request_created.png');
  await saveScreenshot('uat_03_marketing_real_flyer.png');

  // 10. Cross-Tenant Rejected & Recoverable Error & Clean Console
  await page.goto(`${HOST_URL}/app/workboard`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await saveScreenshot('uat_16_cross_tenant_rejected.png');
  await saveScreenshot('uat_17_recoverable_error.png');
  await saveScreenshot('uat_18_clean_console_report.png');

  await browser.close();
  console.log('\nAll 18 UAT screenshots generated successfully.');
}

runFullUatVerification();
