import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3882';

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
      ADMIN_BOOTSTRAP_SECRET: 'test-secret',
      JWT_SECRET: 'mock_jwt_secret_for_e2e_testing_purposes',
      PORT
    }
  });

  await new Promise((resolve) => setTimeout(resolve, 8000));
});

test.afterAll(async () => {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
});

async function performLogin(page: any) {
  await page.waitForURL(url => url.pathname.includes('/login'), { timeout: 15000 }).catch(() => {});
  const emailInput = page.locator('input[type="email"]');
  const passcode = page.locator('input[type="password"]');
  await passcode.waitFor({ state: 'visible', timeout: 15000 });
  
  if (await emailInput.isVisible()) {
    await emailInput.fill('owner@nestrealty.com');
    await passcode.fill('password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(800);
    const loginError = page.locator('text=Invalid email or password.');
    if (await loginError.isVisible()) {
      await emailInput.fill('marcus@shapework.co');
      await passcode.fill('shapework2026');
      await page.click('button[type="submit"]');
    }
  } else {
    await passcode.fill('shapework2026');
    await page.click('button[type="submit"]');
  }
}

test('Verify Integration Router Route Paths and Webhooks respond correctly', async ({ page, request }) => {
  test.setTimeout(60000);
  await page.goto(`http://localhost:${PORT}/app/integrations`);
  await performLogin(page);

  // Authenticate API request context by getting token cookie or logging in
  // Let's test endpoints directly via request API
  // Plaid connection stubs
  const plaidRes = await request.post(`http://localhost:${PORT}/api/integrations/plaid/link-token`);
  expect(plaidRes.status()).toBe(401); // Unauthorized since no session cookies passed in direct API request without headers, but route exists!

  // Resend webhook stub path
  const resendWebhook = await request.post(`http://localhost:${PORT}/api/webhooks/resend`);
  expect(resendWebhook.status()).toBe(501); // Not Implemented

  // Zapier webhook stub path
  const zapierWebhook = await request.post(`http://localhost:${PORT}/api/webhooks/zapier/workspace123/secret123`);
  expect(zapierWebhook.status()).toBe(501); // Not Implemented
});
