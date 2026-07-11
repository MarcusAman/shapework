import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3053';

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

  serverProcess.stdout?.on('data', (data) => console.log(`[Forgot Server STDOUT] ${data}`));
  serverProcess.stderr?.on('data', (data) => console.error(`[Forgot Server STDERR] ${data}`));

  await new Promise((resolve) => setTimeout(resolve, 8000));
});

test.afterAll(async () => {
  if (serverProcess) {
    serverProcess.kill('SIGKILL');
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
});

test('forgot password flow and generic response behavior', async ({ page }) => {
  // 1. Navigate to /forgot-password
  await page.goto(`http://localhost:${PORT}/forgot-password`);

  // Verify elements
  await expect(page.locator('h1:has-text("Reset your password.")')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('text=Enter your email and we’ll send reset instructions.')).toBeVisible();

  // 2. Submit non-existent email
  await page.locator('input[type="email"]').fill('nonexistent@shapework.co');
  await page.locator('button[type="submit"]').click();

  // Verify generic success response
  await expect(page.locator('text=If an account exists for that email, reset instructions have been sent.')).toBeVisible({ timeout: 10000 });
  
  // 3. Return to forgot-password page and submit a valid email
  await page.goto(`http://localhost:${PORT}/forgot-password`);
  await page.locator('input[type="email"]').fill('sarah.j@nest-demo.local');
  await page.locator('button[type="submit"]').click();

  // Verify it shows identical generic response (no leakage of account status)
  await expect(page.locator('text=If an account exists for that email, reset instructions have been sent.')).toBeVisible({ timeout: 10000 });
});
