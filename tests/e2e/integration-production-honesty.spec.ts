import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3884';

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

  // Launch server in simulated production mode
  serverProcess = spawn('npx', ['tsx', 'server.ts'], {
    env: {
      ...process.env,
      APP_MODE: 'development',
      NODE_ENV: 'production',
      STORAGE_DRIVER: 'local',
      DEMO_PASSCODE: 'shapework2026',
      ADMIN_BOOTSTRAP_SECRET: 'test-secret',
      JWT_SECRET: 'mock_jwt_secret_for_e2e_testing_purposes',
      RESEND_API_KEY: 're_mock_key_for_prod_testing_12345',
      RESEND_WEBHOOK_SECRET: 'whsec_mock_secret_for_prod_testing_12345',
      PORT
    }
  });

  serverProcess.stdout?.on('data', (data) => console.log('SERVER STDOUT:', data.toString()));
  serverProcess.stderr?.on('data', (data) => console.error('SERVER STDERR:', data.toString()));

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

test('Verify Production Honesty guards and blocks mock consent redirects', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto(`http://localhost:${PORT}/app/integrations`);
  await performLogin(page);
  await page.goto(`http://localhost:${PORT}/app/integrations`);
  await page.locator('aside').first().waitFor({ state: 'visible', timeout: 20000 });

  // Verify that navigating directly to Google connect path does not execute mock OAuth redirect in production
  const response = await page.goto(`http://localhost:${PORT}/api/integrations/google/connect`);
  
  // It should return an error or configuration message, NOT a redirect to a mock consent page
  const responseBody = await response?.text() || '';
  console.log('Simulated Production Connect Response Body:', responseBody);
  
  // It shouldn't redirect to localhost /oauth-mock or contain mock user
  expect(page.url()).not.toContain('oauth-mock');
  expect(responseBody.includes('mock.user@gmail.com') || responseBody.includes('mock_google_access_token')).toBeFalsy();
});
