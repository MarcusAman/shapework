import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3041';

test.beforeAll(async () => {
  const dbPath = path.join(process.cwd(), 'data', 'db.json');
  if (fs.existsSync(dbPath)) {
    try {
      fs.unlinkSync(dbPath);
    } catch (e) {}
  }

  serverProcess = spawn('npx', ['tsx', 'server.ts'], {
    env: {
      ...process.env,
      APP_MODE: 'production',
      STORAGE_DRIVER: 'local',
      DATABASE_URL: 'mongodb://localhost:27017/shapework-test',
      ADMIN_BOOTSTRAP_SECRET: 'test-secret',
      AUTH_PROVIDER_CONFIGURED: 'true',
      CREDENTIAL_ENCRYPTION_KEY: 'mock_encryption_key_32_characters_long!',
      JWT_SECRET: 'mock_jwt_secret_for_e2e_testing_purposes',
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

test('verify homepage CTA structure and navigation target routes', async ({ page }) => {
  await page.goto(`http://localhost:${PORT}/`);
  
  // 1. Homepage header shows Login
  const loginButton = page.locator('nav button:has-text("Login")').first();
  await expect(loginButton).toBeVisible();

  // 2. Homepage header does not show Try the Platform
  const tryButton = page.locator('nav button:has-text("Try the Platform")');
  await expect(tryButton).not.toBeVisible();

  // 3. Homepage header does not show View Demo
  const viewDemoButton = page.locator('nav button:has-text("View Demo")');
  await expect(viewDemoButton).not.toBeVisible();

  // 4. Click login and verify routes to /login
  await loginButton.click();
  await page.waitForURL(`**/login`);
  expect(page.url()).toContain('/login');

  // Go back and test request discovery
  await page.goto(`http://localhost:${PORT}/`);
  const reqDiscoveryButton = page.locator('nav button:has-text("Request Discovery")').first();
  await expect(reqDiscoveryButton).toBeVisible();

  // 5. Request Discovery routes to /discovery
  await reqDiscoveryButton.click();
  await page.waitForURL(`**/discovery`);
  expect(page.url()).toContain('/discovery');
});
