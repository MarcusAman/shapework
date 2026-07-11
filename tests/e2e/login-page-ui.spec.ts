import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3051';

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

test('login page UI components and layout verification', async ({ page }) => {
  await page.goto(`http://localhost:${PORT}/login`);

  // Verify headline & subheadline
  await expect(page.locator('h1:has-text("Log in to shapework.")')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('text=Access your brokerage operating console.')).toBeVisible();

  // Verify form fields
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();

  // Verify buttons and links
  await expect(page.locator('button[type="submit"]:has-text("Log in")')).toBeVisible();
  await expect(page.locator('button:has-text("Forgot password?")')).toBeVisible();
  await expect(page.locator('button:has-text("Back to homepage")')).toBeVisible();

  // Verify left panel background image is present in HTML (referenced as /nest_background_img.png)
  const leftPanel = page.locator('div[style*="/nest_background_img.png"]');
  await expect(leftPanel).toBeVisible();

  // Verify "Back to homepage" redirects to root "/"
  await page.locator('button:has-text("Back to homepage")').click();
  await page.waitForURL(`http://localhost:${PORT}/`);
  expect(page.url()).toBe(`http://localhost:${PORT}/`);
});
