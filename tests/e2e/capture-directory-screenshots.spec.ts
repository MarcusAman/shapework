import { test, expect } from '@playwright/test';
import { spawn, execSync } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3088';

test.beforeAll(async () => {
  try {
    execSync(`lsof -t -sTCP:LISTEN -i:${PORT} | xargs kill -9`, { stdio: 'ignore' });
  } catch (e) {}

  const dbPath = path.join(process.cwd(), 'data', 'db.json');
  if (fs.existsSync(dbPath)) {
    try { fs.unlinkSync(dbPath); } catch (e) {}
  }

  serverProcess = spawn('npx', ['tsx', 'server.ts'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      APP_MODE: 'development',
      STORAGE_DRIVER: 'local',
      ADMIN_BOOTSTRAP_SECRET: 'test-secret',
      PORT
    }
  });

  await new Promise((resolve) => setTimeout(resolve, 8000));
});

test.afterAll(async () => {
  if (serverProcess) {
    serverProcess.kill('SIGKILL');
  }
  try {
    execSync(`lsof -t -sTCP:LISTEN -i:${PORT} | xargs kill -9`, { stdio: 'ignore' });
  } catch (e) {}
});

test('Capture Directory Workflows Screenshots', async ({ page }) => {
  test.setTimeout(120000);
  const targetDir = '/Users/marcusaman/.gemini/antigravity/brain/bf7df080-34eb-4887-bcda-c6db08aae962';

  await page.setViewportSize({ width: 1280, height: 800 });

  // 1. Read-only empty state
  await page.goto(`http://localhost:${PORT}/login`);
  await page.locator('input[type="email"]').fill('owner@nestrealty.com');
  await page.locator('input[type="password"]').fill('password123');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(`**/app/**`);
  await expect(page.locator('text=Loading shapework...')).not.toBeVisible({ timeout: 15000 });
  await page.goto(`http://localhost:${PORT}/app/directory`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(targetDir, 'directory-1-readonly-empty.png') });

  // Clear session
  await page.context().clearCookies();
  
  // 2. Manager empty state
  await page.goto(`http://localhost:${PORT}/login`);
  await page.locator('input[type="email"]').fill('admin@shapework.co');
  await page.locator('input[type="password"]').fill('shapework2026');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(`**/app/**`);
  await page.goto(`http://localhost:${PORT}/app/directory`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(targetDir, 'directory-2-manager-empty.png') });

  // 3. Add Person drawer open
  await page.locator('button:has-text("+ Add Person")').first().click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(targetDir, 'directory-3-add-person-drawer.png') });

  // Fill and trigger duplicate warning
  await page.locator('input[placeholder="e.g. Mary Kaye"]').fill('Mary Kaye');
  await page.locator('input[placeholder="e.g. Hester"]').fill('Hester');
  await page.locator('input[placeholder="e.g. name@nestrealty.com"]').fill('mary@nestrealty.com');
  await page.locator('button:has-text("Create Contact")').click();
  await page.waitForTimeout(1000);

  // 4. Create duplicate to trigger warning
  await page.locator('button:has-text("+ Add Person")').first().click();
  await page.waitForTimeout(1000);
  await page.locator('input[placeholder="e.g. Mary Kaye"]').fill('Mary Kaye');
  await page.locator('input[placeholder="e.g. Hester"]').fill('Hester');
  await page.locator('button:has-text("Create Contact")').click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(targetDir, 'directory-4-duplicate-warning.png') });

  // Dismiss duplicate warning and drawer
  await page.locator('button:has-text("Cancel")').nth(1).click();
  await page.locator('button:has-text("Cancel")').first().click();
  await page.waitForTimeout(500);

  // 5. Open Import Wizard - Step 1: Choose Source
  await page.locator('button:has-text("Import Directory")').first().click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(targetDir, 'directory-5-wizard-step1-source.png') });

  // Select Google Sheets
  await page.locator('button:has-text("Google Sheets Sync")').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(targetDir, 'directory-6-wizard-step2-config.png') });

  // Load URL
  await page.locator('input[type="url"]').fill('https://docs.google.com/spreadsheets/d/1ESWBGGQTz614hT_t1WNLtDHAZz7pApRy');
  await page.locator('button:has-text("Load Columns")').click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(targetDir, 'directory-7-wizard-step3-mapping.png') });

  // Generate Preview
  await page.locator('button:has-text("Generate Preview")').click();
  await page.waitForTimeout(4000);
  await page.screenshot({ path: path.join(targetDir, 'directory-8-wizard-step4-preview.png') });

  // Apply changes
  await page.locator('button:has-text("Apply Import changes")').click();
  await page.waitForTimeout(4000);
  await page.screenshot({ path: path.join(targetDir, 'directory-9-wizard-step5-results.png') });

  // Close wizard and view loaded list view
  await page.locator('button:has-text("Close")').click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(targetDir, 'directory-10-list-view.png') });

  // Open details drawer
  await page.locator('text=Mary Kaye Hester').first().click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(targetDir, 'directory-11-person-details.png') });
});
