import { chromium } from 'playwright';
import { spawn } from 'child_process';
import path from 'path';

async function captureScreenshots() {
  // Start server process
  const server = spawn('npx', ['tsx', 'server.ts'], {
    cwd: path.resolve(import.meta.dirname, '..'),
    env: { ...process.env, PORT: '3099' },
    stdio: 'ignore',
  });

  // Wait 3 seconds for server to start
  await new Promise((resolve) => setTimeout(resolve, 4000));

  try {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    const artifactDir = '/Users/marcusaman/.gemini/antigravity/brain/438d0515-eff4-4e56-ad09-da389d4b82d9/';

    // 1. Root Campaign List View (selectedCampaignId === null)
    await page.goto('http://localhost:3099/app/marketing');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(artifactDir, 'marketing_separated_campaign_list_1440.png') });
    console.log('Saved marketing_separated_campaign_list_1440.png');

    // 2. Dedicated 3-Area Workspace View (Property Flyer selected)
    await page.goto('http://localhost:3099/app/marketing?campaign=campaign_990_inspiration&mode=review&asset=flyer');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(artifactDir, 'marketing_dedicated_workspace_flyer_1440.png') });
    console.log('Saved marketing_dedicated_workspace_flyer_1440.png');

    // 3. Dedicated 3-Area Workspace View (Social Package selected)
    await page.goto('http://localhost:3099/app/marketing?campaign=campaign_990_inspiration&mode=review&asset=carousel');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(artifactDir, 'marketing_dedicated_workspace_social_1440.png') });
    console.log('Saved marketing_dedicated_workspace_social_1440.png');

    await browser.close();
  } finally {
    server.kill();
  }
}

captureScreenshots().catch(console.error);
