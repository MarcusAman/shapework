import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = '/Users/marcusaman/.gemini/antigravity/brain/438d0515-eff4-4e56-ad09-da389d4b82d9';

async function captureScreenshots() {
  console.log('Launching browser to capture clean Nest UAT screenshots...');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const routes = [
    { url: 'http://localhost:3049/app/marketing', file: 'uat_nest_clean_marketing_intake.png' },
    { url: 'http://localhost:3049/app/directory', file: 'uat_nest_clean_directory.png' },
    { url: 'http://localhost:3049/app/org-chart', file: 'uat_nest_clean_org_chart.png' },
    { url: 'http://localhost:3049/app/sops', file: 'uat_nest_clean_sop_library.png' }
  ];

  for (const r of routes) {
    try {
      await page.goto(r.url, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(1000);
      const outPath = path.join(ARTIFACT_DIR, r.file);
      await page.screenshot({ path: outPath, fullPage: false });
      console.log(`✓ Saved clean tenant screenshot: ${r.file}`);
    } catch (e: any) {
      console.error(`Failed to capture ${r.url}:`, e.message);
    }
  }

  await browser.close();
  console.log('Clean UAT tenant screenshot capture finished.');
}

captureScreenshots();
