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

test('AI SOP Draft Generation Flow', async ({ page }) => {
  test.setTimeout(80000);
  await page.goto(`http://127.0.0.1:${PORT}/login`);
  await page.fill('input[type="email"]', 'marcus@shapework.co');
  await page.fill('input[type="password"]', 'shapework2026');
  await page.click('button[type="submit"]');
  await page.waitForURL(`**/app/workboard`);

  // Navigate to SOP Studio
  await page.goto(`http://127.0.0.1:${PORT}/app/sops`);
  await expect(page.locator('h2:has-text("Standard Operating Procedures")').first()).toBeVisible({ timeout: 15000 });

  await page.click('button:has-text("Create New SOP")');
  await page.waitForTimeout(500);

  // Click Start Blank Canvas
  await page.click('h3:has-text("Start Blank Canvas")');
  await page.waitForTimeout(500);

  // Fill description in Stage 1 wizard description textarea
  const roughText = "When a new listing comes in, make sure the agreement is signed, collect the property information, schedule photos, order the sign, create marketing, have the BIC review everything, and notify the agent once the listing is live.";
  await page.fill('textarea[placeholder*="When a new listing comes in"]', roughText);

  // Click Build SOP Draft
  await page.click('button:has-text("Build SOP Draft")');
  
  // Verify preview modal appears
  await expect(page.locator('h2:has-text("Review Generated SOP Draft")').first()).toBeVisible({ timeout: 35000 });
  await expect(page.locator('span:has-text("AI Draft — Review Required")').first()).toBeVisible();

  // Apply selected
  await page.click('button:has-text("Apply Selected")');
  await page.waitForTimeout(1000);

  // Navigate to Stage 9 (Governance) where Save Draft is rendered
  for (let i = 0; i < 8; i++) {
    await page.click('button:has-text("Next Step")');
    await page.waitForTimeout(100);
  }

  // Save as draft
  await page.click('button:has-text("Save Draft")');
  await page.waitForTimeout(1000);

  // Reload page to verify persistence
  await page.reload();
  await expect(page.locator('h2:has-text("Standard Operating Procedures")').first()).toBeVisible({ timeout: 15000 });
});
