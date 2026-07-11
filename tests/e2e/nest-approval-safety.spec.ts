import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3026';

test.beforeAll(async () => {
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

  await new Promise((resolve) => setTimeout(resolve, 6000));
});

test.afterAll(async () => {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
});

test('Approval Safety: Review requests trigger proposals in approvals', async ({ page }) => {
  await page.goto(`http://localhost:${PORT}/app/marketing`);
  const passcode = page.locator('input[type="password"]');
  await passcode.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  if (await passcode.isVisible()) {
    await passcode.fill('shapework2026');
    await page.click('button[type="submit"]');
  }

  await page.locator('aside').first().waitFor({ state: 'visible', timeout: 8000 });

  // Submit a review request proposal
  const selectType = page.locator('select').first();
  await selectType.selectOption('review_request');

  const addressInput = page.locator('input[placeholder="e.g. 102 Pine Street"]');
  await addressInput.fill('404 Oak Street');

  // Submit
  await page.click('button[type="submit"]');

  // Wait for submission completion
  await page.locator('text="Collateral Request Logged"').waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});

  // Go to Approvals page via side rail
  await page.goto(`http://localhost:${PORT}/app/approvals`);

  // Verify the Google review request is pending approval
  await expect(page.locator('text=Gated Review Request').first()).toBeVisible();
});
