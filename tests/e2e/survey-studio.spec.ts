import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3055';

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

  await new Promise((resolve) => setTimeout(resolve, 8000));
});

test.afterAll(async () => {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
});

test('Survey Studio - Creation, Editing, Publishing, Public Submission, and Responses Triage Flow', async ({ page }) => {
  // 1. Login to internal console as Admin
  await page.goto(`http://localhost:${PORT}/login`);
  await page.fill('input[type="email"]', 'marcus@shapework.co');
  await page.fill('input[type="password"]', 'shapework2026');
  await page.click('button[type="submit"]');
  await page.waitForURL(`**/app/workboard`);

  // 2. Navigate to Survey Studio library
  await page.goto(`http://localhost:${PORT}/internal/market-intelligence/surveys`);
  await expect(page.locator('h2:has-text("Survey Studio")')).toBeVisible({ timeout: 15000 });

  // Verify migrated legacy survey template is present
  await expect(page.locator('h3:has-text("Brokerage Operational Intelligence Survey")')).toBeVisible();

  // 3. Create a new survey
  await page.click('button:has-text("Create Survey")');
  await expect(page.locator('h3:has-text("Create New Custom Survey")')).toBeVisible();

  await page.fill('input[placeholder="e.g. 2026 Brokerage Technology & Operations Survey"]', '2026 Brokerage Tech & Ops Survey');
  await page.fill('textarea[placeholder="What is this survey for? (visible only to Matt & Adam)"]', 'Internal technology split and compliance audit research.');
  await page.click('button:has-text("Create Studio Envelope")');

  // Verify builder is loaded
  const titleInput = page.locator('input.font-serif');
  await expect(titleInput).toHaveValue('2026 Brokerage Tech & Ops Survey', { timeout: 10000 });

  // 4. Edit Builder Canvas (Add a short answer and a rating question)
  await page.click('button:has-text("Short Answer text")');
  const firstQuestionInput = page.locator('input[placeholder="Describe the question text..."]').first();
  await expect(firstQuestionInput).toHaveValue('New Question', { timeout: 5000 });
  
  // Update question title
  await firstQuestionInput.fill('Brokerage Name');
  await page.click('label:has-text("Required Answer field")'); // Mark required

  // Add rating question
  await page.click('button:has-text("1-5 Rating scale")');
  const secondQuestionInput = page.locator('input[placeholder="Describe the question text..."]').nth(1);
  await expect(secondQuestionInput).toHaveValue('New Question', { timeout: 5000 });
  await secondQuestionInput.fill('Leadership is regularly pulled into client fire drills.');

  // Wait for draft auto-save indicator
  await expect(page.locator('span:has-text("Draft auto-saved successfully.")')).toBeVisible({ timeout: 8000 });

  // 5. Publish the survey
  page.on('dialog', async dialog => {
    expect(dialog.message()).toContain('publish');
    await dialog.accept();
  });
  await page.click('button:has-text("Publish Changes")');
  await page.waitForTimeout(1000);

  // 6. Access Public Survey URL & Submit Response
  await page.goto(`http://localhost:${PORT}/survey/2026-brokerage-tech-ops-survey`);
  await expect(page.locator('h1:has-text("2026 Brokerage Tech & Ops Survey")')).toBeVisible({ timeout: 10000 });

  // Fill in answers
  await page.fill('input[placeholder="Enter answer details..."]', 'Nest Realty Wilmington');
  
  // Answer rating split
  await page.click('button:has-text("4")');

  // Submit
  await page.click('button:has-text("Submit Evaluation")');

  // Verify submission confirmed scorecard displays
  await expect(page.locator('span:has-text("Submission Confirmed")')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('span:has-text("Overall Score")')).toBeVisible();

  // 7. Verify submission details inside Internal Responses Dashboard
  await page.goto(`http://localhost:${PORT}/internal/market-intelligence/surveys`);
  await expect(page.locator('h2:has-text("Survey Studio")')).toBeVisible({ timeout: 10000 });
  
  // Click on responses of the newly created survey
  await page.click('div.p-4:has(h3:has-text("2026 Brokerage Tech & Ops Survey")) >> button:has-text("Responses")');
  
  // Verify that the table row is present
  await expect(page.locator('span:has-text("Nest Realty Wilmington")')).toBeVisible({ timeout: 10000 });

  // Inspect the details drawer
  await page.click('span:has-text("Nest Realty Wilmington")');
  await expect(page.locator('h4:has-text("Inspect Submission details")')).toBeVisible();
  await expect(page.locator('span:has-text("Leadership is regularly pulled into client fire drills.")')).toBeVisible();
});
