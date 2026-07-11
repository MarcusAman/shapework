import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3012';

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
      APP_MODE: 'development', // Bypass production auth/db validation
      STORAGE_DRIVER: 'local',
      DEMO_PASSCODE: 'shapework2026',
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

async function loginAndNavigate(page: any, route: string) {
  await page.goto(`http://localhost:${PORT}${route}`);

  // Fill password passcode if visible
  const passcode = page.locator('input[type="password"]');
  await passcode.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  if (await passcode.isVisible()) {
    await passcode.fill('shapework2026');
    await page.click('button[type="submit"]');
  }

  // Wait for AppShell sidebar elements
  await page.locator('aside').first().waitFor({ state: 'visible', timeout: 8000 });
}

test('Route /app renders Today in the Brokerage', async ({ page }) => {
  await loginAndNavigate(page, '/app');
  await expect(page.locator('h1:has-text("Today in the Brokerage")')).toBeVisible();
  await expect(page.locator('h1:has-text("Compliance")')).not.toBeVisible();
  await expect(page.locator('h1:has-text("Marketing Requests")')).not.toBeVisible();
  // Ensure no demo warnings are shown
  await expect(page.locator('text="Sandbox Mode"')).not.toBeVisible();
});

test('Route /app/work-queue renders Work Queue', async ({ page }) => {
  await loginAndNavigate(page, '/app/work-queue');
  await expect(page.locator('h1:has-text("Work Queue")')).toBeVisible();
  await expect(page.locator('h1:has-text("Today in the Brokerage")')).not.toBeVisible();
});

test('Route /app/transactions renders Transactions', async ({ page }) => {
  await loginAndNavigate(page, '/app/transactions');
  await expect(page.locator('h1:has-text("Transactions")')).toBeVisible();
  await expect(page.locator('h1:has-text("Today in the Brokerage")')).not.toBeVisible();
});

test('Route /app/compliance renders Compliance and empty state', async ({ page }) => {
  await loginAndNavigate(page, '/app/compliance');
  await expect(page.locator('h1:has-text("Compliance")')).toBeVisible();
  const empty = page.locator('text="No compliance risks right now."');
  const active = page.locator('text="Closing Compliance Guard Active"');
  await expect(empty.or(active)).toBeVisible();
  await expect(page.locator('h1:has-text("Today in the Brokerage")')).not.toBeVisible();
});

test('Route /app/marketing renders Marketing Requests and empty state', async ({ page }) => {
  await loginAndNavigate(page, '/app/marketing');
  await expect(page.locator('h1:has-text("Marketing Requests")')).toBeVisible();
  const empty = page.locator('text="No marketing requests yet."');
  const active = page.locator('text="Marketing Request Desk"');
  await expect(empty.or(active)).toBeVisible();
  await expect(page.locator('h1:has-text("Today in the Brokerage")')).not.toBeVisible();
});

test('Route /app/people renders People & Ownership', async ({ page }) => {
  await loginAndNavigate(page, '/app/people');
  await expect(page.locator('h1:has-text("People & Ownership")')).toBeVisible();
  
  // Switch to Role Ownership Map subtab to check map rendering
  await page.click('button:has-text("Role Ownership Map")');
  await expect(page.locator('text="Role Ownership & Responsibilities Map"')).toBeVisible();

  // Switch to Escalation Paths subtab to check hierarchy rendering
  await page.click('button:has-text("Escalation Paths")');
  await expect(page.locator('text="Escalation Hierarchy"')).toBeVisible();

  // Ensure no AI Workforce controls or simulator tabs are visible
  await expect(page.locator('text="Specialist Workforce"')).not.toBeVisible();
  await expect(page.locator('text="Agent Onboarding Board"')).not.toBeVisible();
});

test('Route /app/office renders Office & Signage and empty state', async ({ page }) => {
  await loginAndNavigate(page, '/app/office');
  await expect(page.locator('h1:has-text("Office & Signage")')).toBeVisible();
  const empty = page.locator('text="No office or signage issues."');
  const active = page.locator('text="Office Readiness & Signage"');
  await expect(empty.or(active)).toBeVisible();
  await expect(page.locator('h1:has-text("Today in the Brokerage")')).not.toBeVisible();
});

test('Route /app/approvals renders Approvals and empty state', async ({ page }) => {
  await loginAndNavigate(page, '/app/approvals');
  await expect(page.locator('h1:has-text("Approvals")')).toBeVisible();
  const empty = page.locator('text="Nothing waiting for approval."');
  const active = page.locator('text="Approval Center"');
  await expect(empty.or(active)).toBeVisible();
  await expect(page.locator('h1:has-text("Today in the Brokerage")')).not.toBeVisible();
});

test('Route /app/owner-brief renders Owner Brief and empty state', async ({ page }) => {
  await loginAndNavigate(page, '/app/owner-brief');
  await expect(page.locator('h1:has-text("Owner Brief")')).toBeVisible();
  const empty = page.locator('text="No owner brief generated yet."');
  const active = page.locator('text="Weekly Owner Brief & Shield"');
  await expect(empty.or(active)).toBeVisible();
  await expect(page.locator('h1:has-text("Today in the Brokerage")')).not.toBeVisible();
});

test('Route /app/integrations renders Integrations', async ({ page }) => {
  await loginAndNavigate(page, '/app/integrations');
  await expect(page.locator('h1:has-text("Integrations")')).toBeVisible();
  await expect(page.locator('h1:has-text("Today in the Brokerage")')).not.toBeVisible();
});

test('Route /app/audit renders Audit page', async ({ page }) => {
  await loginAndNavigate(page, '/app/audit');
  await expect(page.locator('h1:has-text("Audit")')).toBeVisible();
  await expect(page.locator('h1:has-text("Today in the Brokerage")')).not.toBeVisible();
});

test('Route /app/settings renders Settings page', async ({ page }) => {
  await loginAndNavigate(page, '/app/settings');
  await expect(page.locator('h1:has-text("Settings")')).toBeVisible();
  await expect(page.locator('h1:has-text("Today in the Brokerage")')).not.toBeVisible();
});
