import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3047';

test.beforeAll(async () => {
  // Clear any existing JSON DB state in tests
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'db.json');
  if (fs.existsSync(dbPath)) {
    try {
      fs.unlinkSync(dbPath);
    } catch (e) {}
  }

  serverProcess = spawn('npx', ['tsx', 'server.ts'], {
    env: {
      ...process.env,
      APP_MODE: 'development',
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

  await new Promise((resolve) => setTimeout(resolve, 10000));
});

test.afterAll(async () => {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
});

test('Brokerage Operational Intelligence Assessment - End to End Flow', async ({ page }) => {
  // 1. Visit Public Assessment Page and fill Profile step
  await page.goto(`http://localhost:${PORT}/assessment/brokerage-operational-intelligence`);
  await expect(page.locator('h1:has-text("Brokerage Operational Intelligence Assessment")')).toBeVisible({ timeout: 15000 });
  
  await page.fill('input[placeholder="e.g. Nest Realty"]', 'Test Brokerage Inc');
  await page.fill('input[placeholder="Your name"]', 'John Miller');
  await page.fill('input[placeholder="you@nestrealty.com"]', 'john.miller@testbrokerage.com');
  await page.selectOption('select:has-text("Select Role...")', 'Owner');
  await page.selectOption('select:has-text("Select Size...")', '26–50');
  
  // Navigate to Section 2 (Operational Health Diagnosis)
  await page.click('button:has-text("Continue")');
  await expect(page.locator('span:has-text("Section 2: Operational Health Diagnosis")')).toBeVisible({ timeout: 8000 });

  // 2. Login to Internal Console as Admin
  await page.goto(`http://localhost:${PORT}/login`);
  await page.fill('input[type="email"]', 'marcus@shapework.co');
  await page.fill('input[type="password"]', 'shapework2026');
  await page.click('button[type="submit"]');
  await page.waitForURL(`**/app/workboard`);

  // Navigate to /internal/assessments
  await page.goto(`http://localhost:${PORT}/internal/assessments`);
  await expect(page.locator('h2:has-text("Operational Surveys")')).toBeVisible({ timeout: 12000 });

  // Verify that the seeded assessment records are visible in the table
  await expect(page.locator('td:has-text("Nest Realty Wilmington")').first()).toBeVisible();

  // 3. Inspect Assessment Detail Page
  await page.click('button[title="View response details"]');
  await expect(page.locator('h2:has-text("Nest Realty Wilmington")')).toBeVisible({ timeout: 8000 });

  // Verify category scores and questionnaire tabs
  await expect(page.locator('h4:has-text("Section 6 & 7: Leadership load & AI Automation state")')).toBeVisible();

  // 4. Update Internal Classification tags
  await page.selectOption('label:has-text("Triage Status") + select', { label: 'archived' });
  await page.fill('textarea[placeholder="Record call summaries or custom pilot notes..."]', 'Verified pain points over phone. Highly motivated.');
  await page.click('button:has-text("Save Classification")');
  
  // Verify update success indicator
  await expect(page.locator('span:has-text("Classification updated successfully.")')).toBeVisible({ timeout: 8000 });
});
