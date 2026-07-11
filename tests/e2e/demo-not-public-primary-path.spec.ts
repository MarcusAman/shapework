import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3044';

test.beforeAll(async () => {
  const dbPath = path.join(process.cwd(), 'data', 'db.json');
  if (fs.existsSync(dbPath)) {
    try {
      fs.unlinkSync(dbPath);
    } catch (e) {}
  }

  // Run in development mode to enable the private demo console
  serverProcess = spawn('npx', ['tsx', 'server.ts'], {
    env: {
      ...process.env,
      APP_MODE: 'development',
      STORAGE_DRIVER: 'local',
      PORT
    }
  });

  await new Promise((resolve) => setTimeout(resolve, 8000));
});

test.afterAll(async () => {
  if (serverProcess) {
    serverProcess.kill('SIGKILL');
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
});

test('private demo console remains separate and labeled with sandbox notices', async ({ page }) => {
  await page.goto(`http://localhost:${PORT}/demo`);

  // Bypass passcode gate if visible
  const passcode = page.locator('input[type="password"]');
  if (await passcode.isVisible()) {
    await passcode.fill('demo123');
    await page.click('button[type="submit"]');
  }

  // Verify Sandbox notices exist on /demo
  await expect(page.locator('text=Sandbox Mode').first()).toBeVisible({ timeout: 15000 });
  // Verify it contains the OperatorDock chat widget
  await page.locator('button[title*="Open AI Command Center"]').first().click();
  await expect(page.locator('input[placeholder="Ask shapework. anything..."]').first()).toBeVisible({ timeout: 10000 });
});
