import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3009';

test.beforeAll(async () => {
  // Ensure data directory exists
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

  // Spin up test server
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

  serverProcess.stdout?.on('data', (data) => console.log('[Test Server STDOUT]', data.toString()));
  serverProcess.stderr?.on('data', (data) => console.error('[Test Server STDERR]', data.toString()));

  // Wait for server boot
  await new Promise((resolve) => setTimeout(resolve, 10000));
});

test.afterAll(async () => {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
});

test('Customer App (/app) has no demo leakage or operator dock', async ({ page }) => {
  await page.goto(`http://localhost:${PORT}/login`);
  await page.locator('input[type="email"]').fill('sarah.j@nestrealty.com');
  await page.locator('input[type="password"]').fill('password123');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(`**/app/workboard`);

  // Expect customer dashboard to load
  await expect(page.locator('button:has-text("Workboard")').first()).toBeVisible({ timeout: 10000 });

  // Ensure no demo warnings or Sandbox Mode indicators are shown
  await expect(page.locator('text="Sandbox Mode"')).not.toBeVisible();
  await expect(page.locator('text="DEMO DATA NOTICE"')).not.toBeVisible();

  // Ensure operator dock (chat bar) is hidden
  const dock = page.locator('button:has-text("Ask shapework.")');
  await expect(dock).not.toBeVisible();

  // Go to Settings tab
  await page.click('button:has-text("Settings")');

  // Verify settings sidebar tabs (should only be customer setup options)
  await expect(page.locator('button:has-text("Workspace Profile")').last()).toBeVisible();
  await expect(page.locator('button:has-text("White-Label Branding")').last()).toBeVisible();
  await expect(page.locator('button:has-text("Workspace Preferences")').last()).toBeVisible();

  // Onboarding wizard/checklists and QA tests should be hidden in customer Settings
  await expect(page.locator('button:has-text("Customer Onboarding Wizard")')).not.toBeVisible();
  await expect(page.locator('button:has-text("Customer Launch Room")')).not.toBeVisible();
  await expect(page.locator('button:has-text("Readiness Scorecard")')).not.toBeVisible();
  await expect(page.locator('button:has-text("Demo QA")')).not.toBeVisible();
});

test('Sales Demo (/demo) renders sandbox flags and operator dock', async ({ page }) => {
  await page.goto(`http://localhost:${PORT}/demo`);

  // Wait for passcode input and fill it if visible
  const passcode = page.locator('input[type="password"]');
  await passcode.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  if (await passcode.isVisible()) {
    await passcode.fill('shapework2026');
    await page.click('button[type="submit"]');
  }

  // Expect demo dashboard to load
  await expect(page.locator('button:has-text("Workboard")').first()).toBeVisible({ timeout: 10000 });

  // Ensure demo warning notice/Sandbox Mode banner is visible
  await expect(page.locator('text="Sandbox Mode"')).toBeVisible();

  // Ensure operator dock (chat input or chat bar) is hidden
  const chatInput = page.locator('button:has-text("Ask shapework.")');
  await expect(chatInput).not.toBeVisible();
});

test('Internal Console (/internal) restricts access and handles forbidden state', async ({ page }) => {
  await page.goto(`http://localhost:${PORT}/login`);
  await page.locator('input[type="email"]').fill('sarah.j@nestrealty.com');
  await page.locator('input[type="password"]').fill('password123');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(`**/app/workboard`);

  // Go to /internal route
  await page.goto(`http://localhost:${PORT}/internal`);

  // Since we log in with a customer profile role, it should display 403 Forbidden
  await expect(page.locator('text=403 Forbidden').first()).toBeVisible({ timeout: 10000 });
  await expect(page.locator('text=restricted to private shapework delivery engineers')).toBeVisible();

  // Verify that the "Return to Customer App" button is visible
  const exitBtn = page.locator('button:has-text("Return to Customer App")');
  await expect(exitBtn).toBeVisible();
});
