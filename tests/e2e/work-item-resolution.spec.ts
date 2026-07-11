import { test, expect } from '@playwright/test';
import { spawn, execSync } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3032';

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

test('Work Item Resolution: Resolving underlying issue completes the work item status', async ({ page }) => {
  await page.goto(`http://localhost:${PORT}/app`);
  const passcode = page.locator('input[type="password"]');
  await passcode.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  if (await passcode.isVisible()) {
    await passcode.fill('shapework2026');
    await page.click('button[type="submit"]');
  }

  await page.locator('aside').first().waitFor({ state: 'visible', timeout: 8000 });

  // Initial evaluate to establish work items
  const eval1 = await page.evaluate(async () => {
    const res = await fetch('/api/workflows/evaluate', { method: 'POST' });
    return res.json();
  });

  // Verify that office:sup_2:office_supply_gap is pending
  const targetTask = eval1.dbState.workItems.find((w: any) => w.id === 'office:sup_2:office_supply_gap');
  expect(targetTask).toBeDefined();
  expect(targetTask.status).toBe('pending');

  // Toggle supply stock status to "Out of Stock" (first toggle) then "In Stock" (second toggle)
  await page.evaluate(async () => {
    await fetch('/api/supplies/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ supplyId: 'sup_2' })
    });
    await fetch('/api/supplies/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ supplyId: 'sup_2' })
    });
  });

  // Fetch updated state
  const state2 = await page.evaluate(async () => {
    const res = await fetch('/api/db-state');
    return res.json();
  });

  const updatedTask = state2.workItems.find((w: any) => w.id === 'office:sup_2:office_supply_gap');
  expect(updatedTask).toBeDefined();
  // It should now be completed as the low stock condition was resolved!
  expect(updatedTask.status).toBe('completed');
});
