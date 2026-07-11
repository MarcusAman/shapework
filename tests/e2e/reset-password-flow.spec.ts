import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3054';
let lastStdout = '';

test.beforeAll(async () => {
  const dbPath = path.join(process.cwd(), 'data', 'db.json');
  if (fs.existsSync(dbPath)) {
    try {
      fs.unlinkSync(dbPath);
    } catch (e) {}
  }

  // Run in development mode to allow mock email logging
  serverProcess = spawn('npx', ['tsx', 'server.ts'], {
    env: {
      ...process.env,
      APP_MODE: 'development',
      STORAGE_DRIVER: 'local',
      ADMIN_BOOTSTRAP_SECRET: 'test-secret',
      AUTH_PROVIDER_CONFIGURED: 'true',
      CREDENTIAL_ENCRYPTION_KEY: 'mock_encryption_key_32_characters_long!',
      JWT_SECRET: 'mock_jwt_secret_for_e2e_testing_purposes',
      PASSWORD_RESET_SECRET: 'mock_password_reset_secret_key_32_chars!',
      DISABLE_HMR: 'true',
      PORT
    }
  });

  serverProcess.stdout?.on('data', (data) => {
    const output = data.toString();
    console.log(`[Server stdout] ${output.trim()}`);
    lastStdout += output;
  });

  serverProcess.stderr?.on('data', (data) => {
    console.error(`[Server stderr] ${data.toString().trim()}`);
  });

  await new Promise((resolve) => setTimeout(resolve, 8000));
});

test.afterAll(async () => {
  if (serverProcess) {
    serverProcess.kill('SIGKILL');
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
});

test('reset password validation and token consumption flow', async ({ page, context }) => {
  page.on('console', msg => console.log(`[Browser Console] ${msg.type().toUpperCase()}: ${msg.text()}`));
  page.on('pageerror', err => console.error(`[Browser PageError] ${err.message}`));
  page.on('request', req => console.log(`[Network Request] >> ${req.method()} ${req.url()}`));
  page.on('response', res => console.log(`[Network Response] << ${res.status()} ${res.url()}`));

  await context.clearCookies();
  // 1. Visit /reset-password with invalid token
  await page.goto(`http://localhost:${PORT}/reset-password?token=invalid_or_expired_token_12345`);
  await page.locator('input[placeholder="••••••••••••"]').first().fill('newpassword123');
  await page.locator('input[placeholder="••••••••••••"]').last().fill('newpassword123');
  await page.locator('button[type="submit"]').click();
  await expect(page.locator('text=The reset link is invalid or has expired.')).toBeVisible({ timeout: 10000 });

  // 2. Request a valid password reset token for sarah.j@nestrealty.com
  lastStdout = ''; // clear stdout log buffer
  await page.goto(`http://localhost:${PORT}/forgot-password`);
  await page.locator('input[type="email"]').fill('sarah.j@nestrealty.com');
  await page.locator('button[type="submit"]').click();
  await expect(page.locator('text=If an account exists for that email, reset instructions have been sent.')).toBeVisible({ timeout: 10000 });

  // Wait a short moment for stdout to buffer
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Find the token from stdout
  const tokenMatch = lastStdout.match(/token=([a-f0-9]+)/);
  expect(tokenMatch).not.toBeNull();
  const validToken = tokenMatch ? tokenMatch[1] : '';
  expect(validToken.length).toBeGreaterThan(10);

  // 3. Navigate to /reset-password with the valid token
  await page.goto(`http://localhost:${PORT}/reset-password?token=${validToken}`);
  await expect(page.locator('h1:has-text("Create a new password.")')).toBeVisible({ timeout: 15000 });

  // 4. Test validation: Passwords do not match
  await page.locator('input[placeholder="••••••••••••"]').first().fill('newpassword12345');
  await page.locator('input[placeholder="••••••••••••"]').last().fill('mismatchpassword');
  await page.locator('button[type="submit"]').click();
  await expect(page.locator('text=Passwords do not match.')).toBeVisible();

  // 5. Test validation: Too short (under 12 chars)
  await page.locator('input[placeholder="••••••••••••"]').first().fill('short123');
  await page.locator('input[placeholder="••••••••••••"]').last().fill('short123');
  await page.locator('button[type="submit"]').click();
  await expect(page.locator('text=Password must be at least 12 characters.')).toBeVisible();

  // 6. Test valid submission: Change password successfully
  await page.locator('input[placeholder="••••••••••••"]').first().fill('sarahnewpass2026!');
  await page.locator('input[placeholder="••••••••••••"]').last().fill('sarahnewpass2026!');
  await page.locator('button[type="submit"]').click();

  // Should show success block and allow redirect to /login
  await expect(page.locator('text=Your password has been updated. You can now log in.')).toBeVisible({ timeout: 10000 });
  await page.locator('button:has-text("Log In")').click();
  await page.waitForURL(`**/login`);
  expect(page.url()).toContain('/login');

  // 7. Verify we can log in with the new password
  console.log('Page URL before fill:', page.url());
  console.log('Page HTML before fill:', await page.content());
  await page.locator('input[type="email"]').fill('sarah.j@nestrealty.com');
  await page.locator('input[type="password"]').fill('sarahnewpass2026!');
  await page.locator('button[type="submit"]').click();

  await page.waitForURL(`**/app`);
  expect(page.url()).toContain('/app');
});
