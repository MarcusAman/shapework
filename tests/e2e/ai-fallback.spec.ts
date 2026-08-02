import { test, expect } from '@playwright/test';
import { spawn, execSync } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3082';

test.beforeAll(async () => {
  try {
    execSync(`lsof -t -sTCP:LISTEN -i:${PORT} | xargs kill -9`, { stdio: 'ignore' });
  } catch (e) {}

  const dataDir = path.join(process.cwd(), `data-${PORT}`);
  if (fs.existsSync(dataDir)) {
    fs.rmSync(dataDir, { recursive: true, force: true });
  }

  serverProcess = spawn('npx', ['tsx', 'server.ts'], {
    env: {
      ...process.env,
      APP_MODE: 'development',
      NODE_ENV: 'production',
      STORAGE_DRIVER: 'local',
      DEMO_PASSCODE: 'shapework2026',
      ADMIN_BOOTSTRAP_SECRET: 'test-secret',
      JWT_SECRET: 'mock_jwt_secret_for_e2e_testing_purposes',
      CREDENTIAL_ENCRYPTION_KEY: 'mock_encryption_key_32_characters_long!',
      PASSWORD_RESET_SECRET: 'mock_password_reset_secret_key_32_chars!',
      REAL_AI_TEST: '0', // Disable Gemini mock routing, forcing error fallbacks
      PORT
    }
  });

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Server on port ${PORT} failed to start`));
    }, 25000);

    serverProcess.stdout?.on('data', (data) => {
      if (data.toString().includes('Master full-stack server running')) {
        clearTimeout(timeout);
        resolve(null);
      }
    });
  });
});

test.afterAll(async () => {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
});

test('AI Failure Fallback Flow', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto(`http://127.0.0.1:${PORT}/login`);
  await page.fill('input[type="email"]', 'marcus@shapework.co');
  await page.fill('input[type="password"]', 'shapework2026');
  await page.click('button[type="submit"]');
  await page.waitForURL(`**/app/workboard`);

  await page.goto(`http://127.0.0.1:${PORT}/app/knowledge`);
  await expect(page.locator('button:has-text("SOP Directory")').first()).toBeVisible({ timeout: 15000 });

  // Click Q&A sub-tab
  await page.click('button:has-text("Grounded Q&A (Shapework AI)")');
  await expect(page.locator('h3:has-text("Grounded Q&A Assistant")').first()).toBeVisible();

  // Submit search question (should fail cleanly because we didn't provide passages or simulated error status)
  // Let's force an error on answer
  await page.fill('input[placeholder*="When must photography be completed"]', 'When must photography be completed?');
  
  // Intercept the API to throw a 500 error to simulate AI downtime
  await page.route('**/api/ops/ai/knowledge-answer', route => {
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ success: false, error: 'AI assistance is temporarily unavailable. You can continue editing manually.' })
    });
  });

  await page.click('button[type="submit"]');

  // Verify the error message is displayed to the user
  await expect(page.locator('text=AI assistance is temporarily unavailable. You can continue editing manually.').first()).toBeVisible({ timeout: 15000 });
});
