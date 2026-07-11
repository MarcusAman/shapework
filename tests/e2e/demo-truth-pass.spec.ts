import { test, expect } from '@playwright/test';
import { spawn, execSync } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3037';

test.beforeAll(async () => {
  try {
    execSync(`lsof -t -sTCP:LISTEN -i:${PORT} | xargs kill -9 2>/dev/null || true`, { stdio: 'ignore' });
  } catch (e) {}

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
      ADMIN_BOOTSTRAP_SECRET: 'test-secret',
      AUTH_PROVIDER_CONFIGURED: 'true',
      CREDENTIAL_ENCRYPTION_KEY: 'mock_encryption_key_32_characters_long!',
      JWT_SECRET: 'mock_jwt_secret_for_e2e_testing_purposes',
      PASSWORD_RESET_SECRET: 'mock_password_reset_secret_key_32_chars!',
      PORT
    }
  });

  serverProcess.stdout?.on('data', (data) => console.log('SERVER STDOUT:', data.toString()));
  serverProcess.stderr?.on('data', (data) => console.error('SERVER STDERR:', data.toString()));

  await new Promise((resolve) => setTimeout(resolve, 10000));
});

test.afterAll(async () => {
  if (serverProcess) {
    serverProcess.kill('SIGKILL');
  }
});

test('Brokerage Demo Truth Pass: Guided Scenarios, Preview Modals, Output Receipts, and Brief links', async ({ page }) => {
  // Login
  await page.goto(`http://localhost:${PORT}/login`);
  await page.locator('input[type="email"]').fill('sarah.j@nestrealty.com');
  await page.locator('input[type="password"]').fill('password123');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(`**/app/workboard`);

  // 1. Verify Guided Scenario Panel is visible in development mode
  const scenarioPanel = page.locator('text=Guided Scenario Control Panel');
  await expect(scenarioPanel).toBeVisible();

  // 2. Trigger Compliance Chase scenario
  await page.locator('button:has-text("Run: Compliance Chase")').click();

  // Wait for job step to simulate and pause at waiting_approval status
  const approvalBadge = page.locator('span:has-text("waiting_approval")').first();
  await expect(approvalBadge).toBeVisible({ timeout: 12000 });

  // 3. Click Active operation row to slide drawer open
  await page.locator('button:has-text("Compliance Chase Engine")').first().click();

  // Wait for JobDetailDrawer to open
  await expect(page.locator('text=Planning Timeline')).toBeVisible();

  // 4. Click Approve Step Action inside drawer
  await page.locator('button:has-text("Approve Step Action")').click();

  // 5. Verify Approval Preview Modal slides open with draft details
  await expect(page.locator('text=Approval Request Preview')).toBeVisible();
  await expect(page.locator('text=Draft Action Details')).toBeVisible();

  // 6. Click Approve & Dispatch inside modal preview
  await page.locator('button:has-text("Approve & Dispatch")').click();

  // 7. Verify step completed, job simulates to completion, and completed receipt card appears
  const completedBadge = page.locator('span:has-text("completed")').first();
  await expect(completedBadge).toBeVisible({ timeout: 12000 });

  // Verify completed output receipt shows "Shapework Handled" badge
  await expect(page.locator('span:has-text("Shapework Handled")').first()).toBeVisible();
  await expect(page.locator('button:has-text("Why am I seeing this?")').first()).toBeVisible();

  // 8. Open Owner Brief tab
  await page.locator('button[aria-label="Owner Brief"]').click();
  await page.waitForURL(`**/app/owner-brief`);

  // Verify owner brief links completed wins back to workboard
  const winItem = page.locator('text=Compliance nudge dispatched').first();
  await expect(winItem).toBeVisible();
  await winItem.click();

  // Clicking redirects back to Workboard page
  await page.waitForURL(`**/app/workboard`);
  await expect(page.locator('h1').first()).toContainText('Today in the Brokerage');
});
