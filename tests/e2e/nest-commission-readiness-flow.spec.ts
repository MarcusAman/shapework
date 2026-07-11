import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3023';

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

test('Commission Readiness: Closing ledger displays next actions and source fields', async ({ page }) => {
  await page.goto(`http://localhost:${PORT}/app/transactions`);
  const passcode = page.locator('input[type="password"]');
  await passcode.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  if (await passcode.isVisible()) {
    await passcode.fill('shapework2026');
    await page.click('button[type="submit"]');
  }

  await page.locator('aside').first().waitFor({ state: 'visible', timeout: 8000 });

  // Verify Page header
  await expect(page.locator('h1')).toContainText('Transactions');

  // Verify Next Action header/column exists
  await expect(page.locator('text="Next Action"').first()).toBeVisible();

  // Verify Referral/Source header/column or info exists
  await expect(page.locator('text="Source / Referral"').first()).toBeVisible();

  // Verify expected commission metrics exist
  await expect(page.locator('text="$15,400"').first()).toBeVisible();
});
