import { test, expect } from '@playwright/test';
import { spawn, execSync } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3030';

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

  await new Promise((resolve) => setTimeout(resolve, 8000));
});

test.afterAll(async () => {
  if (serverProcess) {
    serverProcess.kill('SIGKILL');
  }
});

test('Read-Side Safety: GET /api/db-state is read-only and does not mutate work items', async ({ page }) => {
  await page.goto(`http://localhost:${PORT}/app`);
  const passcode = page.locator('input[type="password"]');
  await passcode.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  if (await passcode.isVisible()) {
    await passcode.fill('shapework2026');
    await page.click('button[type="submit"]');
  }

  await page.locator('aside').first().waitFor({ state: 'visible', timeout: 8000 });

  // Get initial state
  const state1 = await page.evaluate(async () => {
    const res = await fetch('/api/db-state');
    return res.json();
  });

  const count1 = (state1.workItems || []).length;

  // Get state again
  const state2 = await page.evaluate(async () => {
    const res = await fetch('/api/db-state');
    return res.json();
  });

  const count2 = (state2.workItems || []).length;

  // Verify that count has not changed on repeated reads
  expect(count1).toBe(count2);
});
