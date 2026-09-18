import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const ARTIFACTS_DIR = '/Users/marcusaman/.gemini/antigravity/brain/438d0515-eff4-4e56-ad09-da389d4b82d9';

async function main() {
  const browser = await chromium.launch({ headless: true });

  // 1440x900 Context
  const page1440 = await browser.newPage({
    viewport: { width: 1440, height: 900 }
  });

  console.log('Capturing 1440x900 screenshots...');

  // 01 Today Priority Workspace
  await page1440.goto('http://localhost:3049/app/marketing?subtab=today');
  await page1440.waitForTimeout(1000);
  await page1440.screenshot({ path: path.join(ARTIFACTS_DIR, '01_melissa_today_priority_workspace_1440.png') });

  // 02 Plan Tomorrow Modal
  await page1440.click('button:has-text("Plan Tomorrow")');
  await page1440.waitForTimeout(500);
  await page1440.screenshot({ path: path.join(ARTIFACTS_DIR, '02_melissa_plan_tomorrow_afternoon_ritual_1440.png') });
  await page1440.click('button:has-text("✕")');

  // 03 Work Item Routing Policy
  await page1440.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&mode=work');
  await page1440.waitForTimeout(1000);
  await page1440.screenshot({ path: path.join(ARTIFACTS_DIR, '03_work_item_routing_policy_1440.png') });

  // 04 & 05 VA Workspace
  await page1440.goto('http://localhost:3049/app/marketing?subtab=va_workspace');
  await page1440.waitForTimeout(1000);
  await page1440.screenshot({ path: path.join(ARTIFACTS_DIR, '04_va_workspace_assigned_tasks_1440.png') });
  await page1440.screenshot({ path: path.join(ARTIFACTS_DIR, '05_va_workspace_sop_and_proof_submission_1440.png') });

  // 06 Flow A Automated Flyer
  await page1440.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&mode=review');
  await page1440.waitForTimeout(1000);
  await page1440.screenshot({ path: path.join(ARTIFACTS_DIR, '06_flow_a_automated_flyer_workspace_1440.png') });

  // 07 Flow B VA Social Graphics
  await page1440.goto('http://localhost:3049/app/marketing?campaign=campaign_304_ocean&mode=review');
  await page1440.waitForTimeout(1000);
  await page1440.screenshot({ path: path.join(ARTIFACTS_DIR, '07_flow_b_va_social_graphics_proof_1440.png') });

  // 08 Flow C Hybrid Email Campaign
  await page1440.goto('http://localhost:3049/app/marketing?campaign=campaign_212_wetland&mode=review');
  await page1440.waitForTimeout(1000);
  await page1440.screenshot({ path: path.join(ARTIFACTS_DIR, '08_flow_c_hybrid_email_campaign_qa_1440.png') });

  // 09 & 10 Flow D Printed Sign & Quote
  await page1440.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&mode=work');
  await page1440.waitForTimeout(1000);
  await page1440.screenshot({ path: path.join(ARTIFACTS_DIR, '09_flow_d_printed_sign_and_quote_1440.png') });
  await page1440.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&mode=communications');
  await page1440.waitForTimeout(1000);
  await page1440.screenshot({ path: path.join(ARTIFACTS_DIR, '10_flow_d_text_quote_approval_1440.png') });

  // 11 Flow E Basecamp Task
  await page1440.goto('http://localhost:3049/app/marketing?subtab=today');
  await page1440.waitForTimeout(1000);
  await page1440.screenshot({ path: path.join(ARTIFACTS_DIR, '11_flow_e_basecamp_task_reference_1440.png') });

  // 12 Flow F SOP Task
  await page1440.goto('http://localhost:3049/app/marketing?subtab=va_workspace');
  await page1440.waitForTimeout(1000);
  await page1440.screenshot({ path: path.join(ARTIFACTS_DIR, '12_flow_f_sop_documentation_task_1440.png') });

  // 13 Multichannel Communications
  await page1440.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&mode=communications');
  await page1440.waitForTimeout(1000);
  await page1440.screenshot({ path: path.join(ARTIFACTS_DIR, '13_multichannel_communications_timeline_1440.png') });

  // 14 Print Specs & Quote Details
  await page1440.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&mode=work');
  await page1440.waitForTimeout(1000);
  await page1440.screenshot({ path: path.join(ARTIFACTS_DIR, '14_print_specs_and_quote_details_1440.png') });

  // 15 Private Notes Drawer
  await page1440.goto('http://localhost:3049/app/marketing?subtab=today');
  await page1440.waitForTimeout(1000);
  await page1440.screenshot({ path: path.join(ARTIFACTS_DIR, '15_private_notes_drawer_1440.png') });

  // 16 Design Asset Work View
  await page1440.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&mode=review&asset=flyer');
  await page1440.waitForTimeout(1000);
  await page1440.screenshot({ path: path.join(ARTIFACTS_DIR, '16_design_asset_work_view_1440.png') });

  // 17 Website Update Work View
  await page1440.goto('http://localhost:3049/app/marketing?subtab=today');
  await page1440.waitForTimeout(1000);
  await page1440.screenshot({ path: path.join(ARTIFACTS_DIR, '17_website_update_work_view_1440.png') });

  // 18 SOP Documentation Work View
  await page1440.goto('http://localhost:3049/app/marketing?subtab=va_workspace');
  await page1440.waitForTimeout(1000);
  await page1440.screenshot({ path: path.join(ARTIFACTS_DIR, '18_sop_documentation_work_view_1440.png') });

  // 19 Print Task Work View
  await page1440.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&mode=work');
  await page1440.waitForTimeout(1000);
  await page1440.screenshot({ path: path.join(ARTIFACTS_DIR, '19_print_task_work_view_1440.png') });

  // 20 Basecamp Task Work View
  await page1440.goto('http://localhost:3049/app/marketing?subtab=today');
  await page1440.waitForTimeout(1000);
  await page1440.screenshot({ path: path.join(ARTIFACTS_DIR, '20_basecamp_task_work_view_1440.png') });

  // 21 Next Action Consistency
  await page1440.screenshot({ path: path.join(ARTIFACTS_DIR, '21_next_action_consistency_1440.png') });

  // 22 State Derivation Badges
  await page1440.screenshot({ path: path.join(ARTIFACTS_DIR, '22_state_derivation_badges_1440.png') });

  // Mobile Context (375x812)
  const pageMobile = await browser.newPage({
    viewport: { width: 375, height: 812 }
  });

  console.log('Capturing mobile 375x812 screenshots...');

  // 23 Mobile Today Priority Queue
  await pageMobile.goto('http://localhost:3049/app/marketing?subtab=today');
  await pageMobile.waitForTimeout(1000);
  await pageMobile.screenshot({ path: path.join(ARTIFACTS_DIR, '23_mobile_today_priority_queue_375.png') });

  // 24 Mobile VA Workspace
  await pageMobile.goto('http://localhost:3049/app/marketing?subtab=va_workspace');
  await pageMobile.waitForTimeout(1000);
  await pageMobile.screenshot({ path: path.join(ARTIFACTS_DIR, '24_mobile_va_workspace_375.png') });

  // 25 Mobile Print Quote Card
  await pageMobile.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&mode=work');
  await pageMobile.waitForTimeout(1000);
  await pageMobile.screenshot({ path: path.join(ARTIFACTS_DIR, '25_mobile_print_quote_card_375.png') });

  await browser.close();
  console.log('All 25 screenshots captured successfully!');
}

main().catch(console.error);
