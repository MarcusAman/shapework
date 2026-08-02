import { test, expect } from '@playwright/test';
import { spawn, execSync } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3077';

test.beforeAll(async () => {
  try {
    execSync(`lsof -t -sTCP:LISTEN -i:${PORT} | xargs kill -9`, { stdio: 'ignore' });
  } catch (e) {}

  // Clean isolated database folder to prevent cross-run state contamination and duplicate cards
  const dbDir = path.join(process.cwd(), `data-${PORT}`);
  if (fs.existsSync(dbDir)) {
    fs.rmSync(dbDir, { recursive: true, force: true });
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

  serverProcess.stdout?.on('data', (data) => console.log(`[Test Server ${PORT} STDOUT]`, data.toString()));
  serverProcess.stderr?.on('data', (data) => console.error(`[Test Server ${PORT} STDERR]`, data.toString()));

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Server on port ${PORT} failed to start within 25 seconds.`));
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

test('SOP Creation Options - Duplicate, Templates, AI, and Import Fallback', async ({ page }) => {
  test.setTimeout(60000);
  // Login
  await page.goto(`http://127.0.0.1:${PORT}/login`);
  await page.fill('input[type="email"]', 'marcus@shapework.co');
  await page.fill('input[type="password"]', 'shapework2026');
  await page.click('button[type="submit"]');
  await page.waitForURL(`**/app/workboard`);

  // Navigate to SOP Studio
  await page.goto(`http://127.0.0.1:${PORT}/app/sops`);
  await expect(page.locator('h2:has-text("Standard Operating Procedures")').first()).toBeVisible({ timeout: 15000 });

  // Open Creation Menu
  await page.click('button:has-text("Create New SOP")');
  await expect(page.locator('h3:has-text("Start Blank Canvas")')).toBeVisible();
  await expect(page.locator('h3:has-text("Clone Templates")')).toBeVisible();
  await expect(page.locator('h3:has-text("Duplicate Existing")')).toBeVisible();

  // Test Import Offline SOP - Not Yet Available Fallback Drawer
  await page.click('text=Import SOP');
  await expect(page.locator('h4:has-text("Feature Not Yet Available")')).toBeVisible();
  await page.click('button:has-text("Understood")');
  await expect(page.locator('h4:has-text("Feature Not Yet Available")')).not.toBeVisible();
});
