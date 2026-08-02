import { test, expect } from '@playwright/test';
import { spawn, execSync } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3071';
const SCREENSHOT_DIR = '/Users/marcusaman/.gemini/antigravity/brain/bf7df080-34eb-4887-bcda-c6db08aae962/screenshots';

test.beforeAll(async () => {
  try {
    execSync(`lsof -t -sTCP:LISTEN -i:${PORT} | xargs kill -9`, { stdio: 'ignore' });
  } catch (e) {}

  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

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

test('SOP Authoring Flow - Blank Canvas Creation and Publishing', async ({ page }) => {
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

  // Stage 1
  await page.fill('input[placeholder="e.g. Listing Launch Checklist"]', 'Custom Blank Checklist');
  await page.fill('textarea[placeholder="Why does this process exist? What friction does it prevent?"]', 'Custom Purpose');
  await page.fill('textarea[placeholder="What constitutes a successful final delivery?"]', 'Custom Outcome');
  await page.click('button:has-text("Next Step")');

  // Stage 2
  await page.fill('input[placeholder="e.g. Signed listing agreement is uploaded to folder."]', 'Manual Trigger Info');
  await page.click('button:has-text("Next Step")');

  // Stage 3
  await page.selectOption('select:near(label:has-text("Process Owner Position"))', { label: 'Principal Broker (Ryan Crecelius)' });
  await page.selectOption('select:near(label:has-text("Primary Handler Position"))', { label: 'Operations Director (Ann Gunn)' });
  await page.click('button:has-text("Next Step")');

  // Stage 4
  await page.click('button:has-text("Next Step")');

  // Stage 5
  await page.click('button:has-text("+ Add Step")');
  await page.fill('input[placeholder="Upload Listing Agreement"]', 'Verify Documents');
  await page.fill('textarea[placeholder="Detailed guidelines on how to execute this step..."]', 'Check all signed paperwork.');
  await page.click('button:has-text("Save Step")');
  await page.click('button:has-text("Next Step")');

  // Stage 6
  await page.click('button:has-text("Next Step")');

  // Stage 7
  await page.click('button:has-text("Next Step")');

  // Stage 8 - Completion Evidence Description
  await page.fill('input[placeholder="e.g. Verify MLS number is saved and final confirmations email logged."]', 'Check all steps are completed.');
  await page.click('button:has-text("Next Step")');

  // Stage 9 - Governance Publish
  await page.click('button:has-text("Publish v1.0")');
  await page.waitForTimeout(1500);

  // Assert in library
  await expect(page.locator('h4:has-text("Custom Blank Checklist")')).toBeVisible({ timeout: 5000 });
});
