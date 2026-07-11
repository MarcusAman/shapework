import { test, expect } from '@playwright/test';
import { spawn, execSync } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3035';

test.beforeAll(async () => {
  try {
    execSync(`kill -9 $(lsof -t -i:${PORT}) || true`);
  } catch (e) {}

  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'db.json');
  if (fs.existsSync(dbPath)) {
    try {
      fs.unlinkSync(dbPath);
    } catch (e) {}
  }

  serverProcess = spawn('npx', ['tsx', 'server.ts'], {
    env: {
      ...process.env,
      APP_MODE: 'development',
      STORAGE_DRIVER: 'local',
      DEMO_PASSCODE: 'shapework2026',
      PORT
    }
  });

  serverProcess.stdout?.on('data', (data) => console.log(`[Review Server STDOUT] ${data}`));
  serverProcess.stderr?.on('data', (data) => console.error(`[Review Server STDERR] ${data}`));

  await new Promise((resolve) => setTimeout(resolve, 8000));
});

test.afterAll(async () => {
  if (serverProcess) {
    serverProcess.kill('SIGKILL');
  }
});

test('Google Review Request Safety: Copy is neutral, gated under approvals', async ({ page }) => {
  // Dismiss dialogs automatically
  page.on('dialog', async dialog => {
    await dialog.accept();
  });

  await page.goto(`http://localhost:${PORT}/demo/transactions`);
  const passcode = page.locator('input[type="password"]');
  await passcode.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  if (await passcode.isVisible()) {
    await passcode.fill('shapework2026');
    await page.click('button[type="submit"]');
  }

  await page.locator('aside').first().waitFor({ state: 'visible', timeout: 8000 });

  // 1. Click on Google Review Dispatch subtab
  await page.locator('button:has-text("Google Review Dispatch")').click();

  // 2. Verify that neutral copy is visible in the draft preview box
  const draftBox = page.locator('text=Thank you for working with our team. If you have a moment, we would appreciate').first();
  await expect(draftBox).toBeVisible();

  // 3. Click Send Request to Client (which submits a proposed action)
  const responsePromise = page.waitForResponse(response => 
    response.url().includes('/api/action/propose') && response.status() === 200
  );
  await page.locator('button:has-text("Send Request to Client")').click();
  await responsePromise;

  // 4. Navigate to Approvals and verify the proposal exists there
  await page.goto(`http://localhost:${PORT}/demo/approvals`);
  await expect(page.locator('h1').first()).toContainText('Approvals');

  // Verify that the proposed review request is visible in the queue
  await expect(page.locator('text=Google Review Request: 102 Pine Street').first()).toBeVisible();
});
