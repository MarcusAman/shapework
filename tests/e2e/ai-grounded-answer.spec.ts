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

test('AI Grounded QA Citation & Deflection Flow', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto(`http://127.0.0.1:${PORT}/login`);
  await page.fill('input[type="email"]', 'marcus@shapework.co');
  await page.fill('input[type="password"]', 'shapework2026');
  await page.click('button[type="submit"]');
  await page.waitForURL(`**/app/workboard`);

  // Navigate to Knowledge Hub
  await page.goto(`http://127.0.0.1:${PORT}/app/knowledge`);
  await expect(page.locator('button:has-text("SOP Directory")').first()).toBeVisible({ timeout: 15000 });

  // Ingest grounding document first
  await page.click('button:has-text("Knowledge Ingestion")');
  await page.fill('input[placeholder="e.g. Wilmington HQ Signs Policy"]', 'Photography Policy');
  await page.fill('textarea[placeholder="Paste document policy text..."]', 'All photography must be completed for a listing launch.');
  await page.click('button:has-text("Upload & Audit")');
  await page.click('button:has-text("Confirm & Index Document")');
  await page.waitForTimeout(1000);

  // Click Q&A sub-tab
  await page.click('button:has-text("Grounded Q&A (Shapework AI)")');
  await expect(page.locator('h3:has-text("Grounded Q&A Assistant")').first()).toBeVisible();

  // Ask supported question
  await page.fill('input[placeholder*="When must photography be completed"]', 'When must photography be completed?');
  await page.click('button[type="submit"]');
  
  // Verify answer and citations
  await expect(page.locator('span:has-text("AI Grounded Answer")').first()).toBeVisible({ timeout: 15000 });
  await expect(page.locator('span:has-text("Citations & Sources")').first()).toBeVisible();

  // Ask unsupported question
  await page.fill('input[placeholder*="When must photography be completed"]', 'What is the dress code for office parties?');
  await page.click('button[type="submit"]');

  // Verify deflection fallback message
  await expect(page.locator('text=No approved Shapework knowledge source currently answers this question.').first()).toBeVisible({ timeout: 15000 });
});
