import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3199';

test.beforeAll(async () => {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  serverProcess = spawn('npx', ['tsx', 'server.ts'], {
    env: {
      ...process.env,
      APP_MODE: 'development',
      STORAGE_DRIVER: 'memory',
      DEMO_PASSCODE: 'shapework2026',
      PORT
    }
  });

  serverProcess.stdout?.on('data', (data) => console.log('[Playwright Server STDOUT]', data.toString()));
  serverProcess.stderr?.on('data', (data) => console.error('[Playwright Server STDERR]', data.toString()));

  // Wait for server boot
  await new Promise((resolve) => setTimeout(resolve, 7000));
});

test.afterAll(async () => {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
});

test('Test all app pages with Playwright and capture desktop & mobile screenshots', async ({ page }) => {
  test.setTimeout(120000); // 2 minutes timeout

  const routes = [
    { path: '/demo', name: '01_command_center', title: 'Command Center' },
    { path: '/app/work-queue', name: '02_work_queue', title: 'Work Queue' },
    { path: '/app/transactions', name: '03_transactions', title: 'Transactions' },
    { path: '/app/compliance', name: '04_compliance', title: 'Compliance Guard' },
    { path: '/app/marketing', name: '05_marketing', title: 'Marketing Desk' },
    { path: '/app/people', name: '06_people', title: 'Roster Directory' },
    { path: '/app/office', name: '07_office', title: 'Office Inventory' },
    { path: '/app/approvals', name: '08_approvals', title: 'Approvals Portal' },
    { path: '/app/owner-brief', name: '09_owner_brief', title: 'Owner Brief' },
    { path: '/app/integrations', name: '10_integrations', title: 'Integrations Hub' },
    { path: '/app/audit', name: '11_brokerage_activity_audit', title: 'Brokerage Activity & Audit Log' },
    { path: '/app/settings', name: '12_launch_settings', title: 'Launch Settings' },
    { path: '/internal', name: '13_internal_console', title: 'Internal Operator Console' }
  ];

  const screenshotDir = path.join(process.cwd(), 'docs/audit/all-pages-screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  // 1. Desktop Viewport Audit (1280 x 800)
  await page.setViewportSize({ width: 1280, height: 800 });

  for (const route of routes) {
    await page.goto(`http://localhost:${PORT}${route.path}`);
    await page.waitForTimeout(1500); // Allow render & animations
    
    // Check page contains no fatal crash errors
    const errorText = page.locator('text=Something went wrong');
    expect(await errorText.isVisible()).toBe(false);

    const desktopPath = path.join(screenshotDir, `${route.name}_desktop.png`);
    await page.screenshot({ path: desktopPath, fullPage: false });
    console.log(`✓ Tested & captured Desktop screenshot: ${route.title} (${route.path}) -> ${route.name}_desktop.png`);
  }

  // 2. Mobile Viewport Audit (375 x 812)
  await page.setViewportSize({ width: 375, height: 812 });

  for (const route of routes) {
    await page.goto(`http://localhost:${PORT}${route.path}`);
    await page.waitForTimeout(1000); // Allow render
    
    const errorText = page.locator('text=Something went wrong');
    expect(await errorText.isVisible()).toBe(false);

    const mobilePath = path.join(screenshotDir, `${route.name}_mobile.png`);
    await page.screenshot({ path: mobilePath, fullPage: false });
    console.log(`✓ Tested & captured Mobile screenshot: ${route.title} (${route.path}) -> ${route.name}_mobile.png`);
  }
});
