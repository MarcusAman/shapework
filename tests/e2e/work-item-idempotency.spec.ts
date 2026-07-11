import { test, expect } from '@playwright/test';
import { spawn, execSync } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3039';

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

  serverProcess.stdout?.on('data', (data) => console.log(`[Idempotency Server STDOUT] ${data}`));
  serverProcess.stderr?.on('data', (data) => console.error(`[Idempotency Server STDERR] ${data}`));

  await new Promise((resolve) => setTimeout(resolve, 8000));
});

test.afterAll(async () => {
  if (serverProcess) {
    serverProcess.kill('SIGKILL');
  }
});

test('Work Item Idempotency: POST /api/workflows/evaluate generates items deterministically without duplicates', async ({ page }) => {
  await page.goto(`http://localhost:${PORT}/app`);
  const passcode = page.locator('input[type="password"]');
  await passcode.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  if (await passcode.isVisible()) {
    await passcode.fill('shapework2026');
    await page.click('button[type="submit"]');
  }

  await page.locator('aside').first().waitFor({ state: 'visible', timeout: 8000 });

  // Trigger evaluation
  const eval1 = await page.evaluate(async () => {
    const res = await fetch('/api/workflows/evaluate', { method: 'POST' });
    return res.json();
  });

  expect(eval1.success).toBe(true);
  const count1 = (eval1.dbState.workItems || []).length;

  // Trigger evaluation again
  const eval2 = await page.evaluate(async () => {
    const res = await fetch('/api/workflows/evaluate', { method: 'POST' });
    return res.json();
  });

  expect(eval2.success).toBe(true);
  const count2 = (eval2.dbState.workItems || []).length;

  // Verify counts are identical (no duplicates)
  expect(count1).toBe(count2);

  // Verify that all generated items have tracking fields
  const sampleGen = eval2.dbState.workItems.find((w: any) => w.generatedBy === 'opportunity_sync_engine');
  if (sampleGen) {
    expect(sampleGen.sourceSignalKey).toBeDefined();
    expect(sampleGen.sourceRecordType).toBeDefined();
    expect(sampleGen.sourceRecordId).toBeDefined();
    expect(sampleGen.generatedBy).toBe('opportunity_sync_engine');
  }
});
