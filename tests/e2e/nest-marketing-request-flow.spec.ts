import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3021';

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

  await new Promise((resolve) => setTimeout(resolve, 10000));
});

test.afterAll(async () => {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
});

test('Marketing Request: Submit incomplete triggers missing info task', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto(`http://localhost:${PORT}/app/marketing`);
  const passcode = page.locator('input[type="password"]');
  await passcode.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  if (await passcode.isVisible()) {
    await passcode.fill('shapework2026');
    await page.click('button[type="submit"]');
  }

  await page.locator('aside').first().waitFor({ state: 'visible', timeout: 15000 });

  // Input listing address
  const addressInput = page.locator('input[placeholder="e.g. 102 Pine Street"]');
  await addressInput.fill('404 Oak Street');

  // Input short description (incomplete)
  const descInput = page.locator('textarea').first();
  await descInput.fill('Short');

  // Fill required target due date
  const dateInput = page.locator('input[type="date"]');
  await dateInput.fill('2026-07-15');

  // Submit
  await page.click('button[type="submit"]');

  // Wait for submission confirmation text
  await expect(page.locator('text=Collateral Request Logged')).toBeVisible();

  // Go to coordinator tab
  await page.locator('button:has-text("Coordinator Queue")').click();

  // Confirm missing info indicator is flagged
  await expect(page.locator('text=MISSING INFO').first()).toBeVisible();
});
