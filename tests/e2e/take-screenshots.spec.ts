import { test } from '@playwright/test';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3015';

test.beforeAll(async () => {
  // Spin up test server
  serverProcess = spawn('npx', ['tsx', 'server.ts'], {
    env: {
      ...process.env,
      APP_MODE: 'development',
      STORAGE_DRIVER: 'memory',
      PORT
    }
  });

  serverProcess.stdout?.on('data', (data) => console.log('[Screenshot Server STDOUT]', data.toString()));
  serverProcess.stderr?.on('data', (data) => console.error('[Screenshot Server STDERR]', data.toString()));

  // Wait for server boot
  await new Promise((resolve) => setTimeout(resolve, 8000));
});

test.afterAll(async () => {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
});

test('Capture all pilot app screenshots', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds timeout

  const routes = [
    { path: '/app', name: 'app.png' },
    { path: '/app/work-queue', name: 'work-queue.png' },
    { path: '/app/transactions', name: 'transactions.png' },
    { path: '/app/compliance', name: 'compliance.png' },
    { path: '/app/marketing', name: 'marketing.png' },
    { path: '/app/people', name: 'people.png' },
    { path: '/app/office', name: 'office.png' },
    { path: '/app/approvals', name: 'approvals.png' },
    { path: '/app/owner-brief', name: 'owner-brief.png' },
    { path: '/app/integrations', name: 'integrations.png' },
    { path: '/app/audit', name: 'audit.png' },
    { path: '/app/settings', name: 'settings.png' }
  ];

  // Login
  await page.goto(`http://localhost:${PORT}/app`);
  const passcode = page.locator('input[type="password"]');
  await passcode.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  if (await passcode.isVisible()) {
    await passcode.fill('shapework2026');
    await page.click('button[type="submit"]');
  }
  await page.locator('aside').first().waitFor({ state: 'visible', timeout: 8000 });

  const screenshotDir = '/Users/marcusaman/Downloads/shapework (2)/docs/audit/final-customer-app-screenshots';
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  for (const route of routes) {
    await page.goto(`http://localhost:${PORT}${route.path}`);
    await page.waitForTimeout(2000); // Allow render
    await page.screenshot({ path: path.join(screenshotDir, route.name) });
    console.log(`Captured screenshot for ${route.path} to ${route.name}`);
  }
});
