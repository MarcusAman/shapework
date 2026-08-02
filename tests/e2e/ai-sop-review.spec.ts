import { test, expect } from '@playwright/test';
import { spawn, execSync } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3074';

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

test('AI SOP Quality Review Verification', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto(`http://127.0.0.1:${PORT}/login`);
  await page.fill('input[type="email"]', 'marcus@shapework.co');
  await page.fill('input[type="password"]', 'shapework2026');
  await page.click('button[type="submit"]');
  await page.waitForURL(`**/app/workboard`);

  await page.goto(`http://127.0.0.1:${PORT}/app/sops`);
  await expect(page.locator('h2:has-text("Standard Operating Procedures")').first()).toBeVisible({ timeout: 15000 });

  // Click View Doc on the first SOP template card
  await page.locator('button:has-text("View Doc")').first().click();
  await page.waitForTimeout(500);

  // Click AI Quality Review tab
  await page.click('button:has-text("AI Quality Review")');
  
  // Verify finding categories
  await expect(page.locator('h3:has-text("SOP Quality Review")').first()).toBeVisible({ timeout: 15000 });
  await expect(page.locator('h4:has-text("Recommended findings")').first()).toBeVisible({ timeout: 15000 });
});
