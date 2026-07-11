import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3020';

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

test('Work Queue: Filters and opportunity work items exist', async ({ page }) => {
  await page.goto(`http://localhost:${PORT}/app/work-queue`);
  const passcode = page.locator('input[type="password"]');
  await passcode.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  if (await passcode.isVisible()) {
    await passcode.fill('shapework2026');
    await page.click('button[type="submit"]');
  }

  await page.locator('aside').first().waitFor({ state: 'visible', timeout: 8000 });

  // Verify Work Queue page header
  await expect(page.locator('h1')).toContainText('Work Queue');

  // Click All active tab to view items assigned to other roles
  await page.locator('button:has-text("All active")').click();

  // Verify that synced opportunity tasks (such as vacant role alert) exist
  await expect(page.locator('text=Vacant Role Alert').first()).toBeVisible();

  // Verify signage inventory alert exists
  await expect(page.locator('text=Low stock alert').first()).toBeVisible();

  // Verify filters are interactive
  const selectFilter = page.locator('select').first();
  if (await selectFilter.isVisible()) {
    await selectFilter.selectOption('all');
    await selectFilter.selectOption('pending');
  }
});
