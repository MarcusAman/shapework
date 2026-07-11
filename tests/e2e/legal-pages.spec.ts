import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3151';

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
      PASSWORD_RESET_SECRET: 'mock_password_reset_secret_key_32_chars!',
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

test('Legal Pages - Verify /terms loads properly and has back link', async ({ page }) => {
  await page.goto(`http://localhost:${PORT}/terms`);

  // Verify page title and headers
  await expect(page.locator('h1:has-text("Terms of Service and End User License Agreement")')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('text=Last Updated: July 2, 2026')).toBeVisible();

  // Verify no sandbox/demo messages
  const bodyText = await page.innerText('body');
  expect(bodyText).not.toContain('demo');
  expect(bodyText).not.toContain('sandbox');

  // Verify "Back to homepage" link works
  await page.locator('button:has-text("Back to homepage")').first().click();
  await page.waitForURL(`http://localhost:${PORT}/`);
  expect(page.url()).toBe(`http://localhost:${PORT}/`);
});

test('Legal Pages - Verify /privacy loads properly and is accessible logged out', async ({ page }) => {
  await page.goto(`http://localhost:${PORT}/privacy`);

  // Verify title
  await expect(page.locator('h1:has-text("Privacy Policy")')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('text=Last Updated: July 2, 2026')).toBeVisible();

  // Verify some clauses
  await expect(page.locator('text=Information We Collect')).toBeVisible();
  await expect(page.locator('text=How We Use Information')).toBeVisible();

  // Verify no sandbox/demo messages
  const bodyText = await page.innerText('body');
  expect(bodyText).not.toContain('demo');
  expect(bodyText).not.toContain('sandbox');
});
