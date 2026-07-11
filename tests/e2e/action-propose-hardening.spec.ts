import { test, expect } from '@playwright/test';
import { spawn, execSync } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3034';

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

  serverProcess.stdout?.on('data', (data) => console.log(`[Propose Server STDOUT] ${data}`));
  serverProcess.stderr?.on('data', (data) => console.error(`[Propose Server STDERR] ${data}`));

  await new Promise((resolve) => setTimeout(resolve, 8000));
});

test.afterAll(async () => {
  if (serverProcess) {
    serverProcess.kill('SIGKILL');
  }
});

test('Action Propose Hardening: Blocks parameter tampering, enforces tenant validation and validation limits', async ({ page }) => {
  // Navigate first to set the browser context origin (avoiding about:blank fetch CORS/network failures)
  await page.goto(`http://localhost:${PORT}/app`);

  // Try sending proposal without authentication/session first
  const unauthRes = await page.evaluate(async () => {
    const res = await fetch('/api/action/propose', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer unauthenticated'
      },
      body: JSON.stringify({ title: 'Hack', draftContent: 'Bad' })
    });
    return { status: res.status };
  });
  expect(unauthRes.status).toBe(401);

  // Authenticate properly
  const passcode = page.locator('input[type="password"]');
  await passcode.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  if (await passcode.isVisible()) {
    await passcode.fill('shapework2026');
    await page.click('button[type="submit"]');
  }

  await page.locator('aside').first().waitFor({ state: 'visible', timeout: 25000 });

  // 1. Submit proposal with mismatched tenant transactionId (cross-workspace parameter tampering)
  const crossTenantRes = await page.evaluate(async () => {
    const res = await fetch('/api/action/propose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Tamper Request',
        draftContent: 'Drafting text',
        transactionId: 'invalid-or-cross-tenant-id'
      })
    });
    return { status: res.status };
  });
  expect(crossTenantRes.status).toBe(403);

  // 2. Submit proposal with missing fields
  const invalidPayloadRes = await page.evaluate(async () => {
    const res = await fetch('/api/action/propose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '',
        draftContent: ''
      })
    });
    return { status: res.status };
  });
  expect(invalidPayloadRes.status).toBe(400);

  // 3. Submit valid proposal
  const validRes = await page.evaluate(async () => {
    const txRes = await fetch('/api/transactions/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientName: 'Sarah Jenkins',
        propertyAddress: '152 Edgewater Lane, Wilmington, NC 28403',
        closingDate: '2026-08-01',
        salesPrice: 500000,
        expectedCommission: 15000,
        referralSource: 'Direct'
      })
    });
    const txData = await txRes.json();
    const txId = txData.transaction.id;

    const res = await fetch('/api/action/propose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Valid Google Review Proposal',
        draftContent: 'Thank you for working with our team.',
        transactionId: txId
      })
    });
    return { status: res.status };
  });
  expect(validRes.status).toBe(200);
});
