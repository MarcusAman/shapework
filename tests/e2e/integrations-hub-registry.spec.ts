import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3879';

test.beforeAll(async () => {
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
      PORT
    }
  });

  serverProcess.stdout?.on('data', (data) => console.log('SERVER STDOUT:', data.toString()));
  serverProcess.stderr?.on('data', (data) => console.error('SERVER STDERR:', data.toString()));

  await new Promise((resolve) => setTimeout(resolve, 8000));
});

test.afterAll(async () => {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
});

async function performLogin(page: any) {
  await page.waitForURL(url => url.pathname.includes('/login'), { timeout: 15000 }).catch(() => {});
  const emailInput = page.locator('input[type="email"]');
  const passcode = page.locator('input[type="password"]');
  await passcode.waitFor({ state: 'visible', timeout: 15000 });
  
  if (await emailInput.isVisible()) {
    await emailInput.fill('owner@nestrealty.com');
    await passcode.fill('password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(800);
    const loginError = page.locator('text=Invalid email or password.');
    if (await loginError.isVisible()) {
      await emailInput.fill('marcus@shapework.co');
      await passcode.fill('shapework2026');
      await page.click('button[type="submit"]');
    }
  } else {
    await passcode.fill('shapework2026');
    await page.click('button[type="submit"]');
  }
}

test('Integrations dynamic hub registry rendering and backend route stubs', async ({ page }) => {
  test.setTimeout(60000);
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  // Navigate to integrations hub page
  await page.goto(`http://localhost:${PORT}/app/integrations`);
  await performLogin(page);

  // Return to integrations page
  await page.goto(`http://localhost:${PORT}/app/integrations`);
  await page.locator('aside').first().waitFor({ state: 'visible', timeout: 20000 });

  // 1. Verify that headers render correctly
  await expect(page.locator('text="Core brokerage systems"').first()).toBeVisible({ timeout: 15000 });
  await expect(page.locator('text="Communication & calendar"').first()).toBeVisible({ timeout: 15000 });
  await expect(page.locator('text="Accounting & finance"').first()).toBeVisible({ timeout: 15000 });

  // 2. Verify specific registry integrations are present in the DOM
  await expect(page.locator('h4:has-text("Rechat Partner Integration")').first()).toBeVisible();
  await expect(page.locator('h4:has-text("Dotloop via API Nation")').first()).toBeVisible();
  await expect(page.locator('h4:has-text("QuickBooks Online")').first()).toBeVisible();
  await expect(page.locator('h4:has-text("Basecamp")').first()).toBeVisible();
  await expect(page.locator('h4:has-text("Google Workspace")').first()).toBeVisible();
  await expect(page.locator('h4:has-text("Microsoft 365")').first()).toBeVisible();
  await expect(page.locator('h4:has-text("Plaid Bank Feeds")').first()).toBeVisible();
  await expect(page.locator('h4:has-text("Zapier Webhooks")').first()).toBeVisible();
  await expect(page.locator('h4:has-text("SMTP / Custom Email Server")').first()).toBeVisible();
  await expect(page.locator('h4:has-text("SMS / Text Gateway")').first()).toBeVisible();

  // 3. Verify alt accessibility text/role for icons is present
  const docloopLogo = page.locator('svg[aria-label="Dotloop Logo"]');
  const googleLogo = page.locator('svg[aria-label="Google Workspace Logo"]');
  await expect(docloopLogo.first()).toBeVisible();
  await expect(googleLogo.first()).toBeVisible();

  // 4. Test connecting a planned integration trigger and assert 501 stub behavior
  const smtpBtn = page.locator('div[data-provider="smtp_email"] >> button:has-text("Connect")').first();
  await expect(smtpBtn).toBeVisible();

  // Override window.alert so Playwright doesn't block on alert dialogs
  await page.evaluate(() => {
    window.alert = (msg) => { console.log('ALERT TRIGGERED:', msg); };
  });

  // Log page console output to capture alerts
  const consoleLogs: string[] = [];
  page.on('console', msg => {
    consoleLogs.push(msg.text());
  });

  await smtpBtn.click();
  await page.waitForTimeout(1000);

  // Assert that the alert for the 501 stub was triggered
  const alertLogged = consoleLogs.some(log => log.includes('ALERT TRIGGERED: This integration path config is planned but not fully implemented yet.'));
  expect(alertLogged).toBeTruthy();
});
