import { test, expect } from '@playwright/test';
import { spawn, execSync } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3072';

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

test('SOP Validation Flow - Block Circular Loops and Missing Elements', async ({ page }) => {
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

  // Create SOP Blank Canvas
  await page.click('button:has-text("Create New SOP")');
  await page.click('h3:has-text("Start Blank Canvas")');
  await page.waitForTimeout(500);

  // Stage 1 - Title missing, check validator is displayed
  await page.click('button:has-text("Next Step")'); // Go to 2
  await page.click('button:has-text("Next Step")'); // Go to 3
  await page.click('button:has-text("Next Step")'); // Go to 4
  await page.click('button:has-text("Next Step")'); // Go to 5
  await page.click('button:has-text("Next Step")'); // Go to 6
  await page.click('button:has-text("Next Step")'); // Go to 7
  await page.click('button:has-text("Next Step")'); // Go to 8
  await page.click('button:has-text("Next Step")'); // Go to 9

  // Attempt Publish and verify blockers
  await page.click('button:has-text("Publish v1.0")');
  await page.waitForTimeout(500);
  await expect(page.locator('strong:has-text("Publish Validation Failures:")')).toBeVisible();
  await expect(page.locator('li:has-text("Title is required.")').or(page.locator('div:has-text("Title is required.")')).first()).toBeVisible();
});
