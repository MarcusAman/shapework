import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3037';

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
      GOOGLE_CLIENT_ID: 'mock_google_client_id',
      GOOGLE_CLIENT_SECRET: 'mock_google_client_secret',
      MICROSOFT_CLIENT_ID: 'mock_microsoft_client_id',
      MICROSOFT_CLIENT_SECRET: 'mock_microsoft_client_secret',
      PORT
    }
  });

  serverProcess.stdout?.on('data', (data) => console.log('SERVER STDOUT:', data.toString()));
  serverProcess.stderr?.on('data', (data) => console.error('SERVER STDERR:', data.toString()));

  await new Promise((resolve) => setTimeout(resolve, 10000));
});

test.afterAll(async () => {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
});

async function performLogin(page: any) {
  // Wait for redirect to /login
  await page.waitForURL(url => url.pathname.includes('/login'), { timeout: 15000 }).catch(() => {});
  
  const emailInput = page.locator('input[type="email"]');
  const passcode = page.locator('input[type="password"]');
  
  // Wait for passcode input to be visible (both forms have it)
  await passcode.waitFor({ state: 'visible', timeout: 15000 });
  
  if (await emailInput.isVisible()) {
    // Attempt development mode owner email first
    await emailInput.fill('owner@nestrealty.com');
    await passcode.fill('password123');
    await page.click('button[type="submit"]');
    
    // If that fails, fallback to admin email
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

test('Workspace Integrations Catalog cards and OAuth loops execute successfully', async ({ page }) => {
  test.setTimeout(60000);
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  // Navigate to integrations hub page
  await page.goto(`http://localhost:${PORT}/app/integrations`);
  
  // Perform auth
  await performLogin(page);

  // Navigate back to integrations page (since login redirects to /app homepage)
  await page.goto(`http://localhost:${PORT}/app/integrations`);

  await page.locator('aside').first().waitFor({ state: 'visible', timeout: 20000 });

  // 1. Verify Catalog cards are visible
  await expect(page.locator('h4:has-text("Google Workspace")').first()).toBeVisible({ timeout: 15000 });
  await expect(page.locator('h4:has-text("Microsoft 365")').first()).toBeVisible({ timeout: 15000 });

  // 2. Verify Connect buttons are visible (disconnect first if pre-connected)
  const initialGoogleDisconnect = page.locator('div[data-provider="google_workspace"] >> button:has-text("Disconnect")').first();
  if (await initialGoogleDisconnect.isVisible()) {
    await initialGoogleDisconnect.click();
    await page.waitForTimeout(1000);
  }
  const googleBtn = page.locator('div[data-provider="google_workspace"] >> button:has-text("Connect")').first();
  await expect(googleBtn).toBeVisible({ timeout: 15000 });

  const initialMsDisconnect = page.locator('div[data-provider="microsoft_365"] >> button:has-text("Disconnect")').first();
  if (await initialMsDisconnect.isVisible()) {
    await initialMsDisconnect.click();
    await page.waitForTimeout(1000);
  }
  const msBtn = page.locator('div[data-provider="microsoft_365"] >> button:has-text("Connect")').first();
  await expect(msBtn).toBeVisible({ timeout: 15000 });

  // 3. Initiate Google Workspace mock OAuth consent flow
  await googleBtn.click();
  
  // Wait for the redirect loop to finish and return to /app/integrations
  await page.waitForURL(url => url.pathname.includes('/app/integrations'), { timeout: 20000 });
  await page.locator('aside').first().waitFor({ state: 'visible', timeout: 20000 });
  
  // Verify that Google Workspace card is now in connected state (Disconnect or Sync Now button should be visible)
  const googleDisconnectBtn = page.locator('div[data-provider="google_workspace"] >> button:has-text("Disconnect")').first();
  await expect(googleDisconnectBtn).toBeVisible({ timeout: 15000 });

  // 4. Connect Microsoft 365 as well
  await msBtn.click();
  
  // Wait for the redirect loop to finish and return to /app/integrations
  await page.waitForURL(url => url.pathname.includes('/app/integrations'), { timeout: 20000 });
  await page.locator('aside').first().waitFor({ state: 'visible', timeout: 20000 });
  
  // Verify both are connected
  const googleDisconnect = page.locator('div[data-provider="google_workspace"] >> button:has-text("Disconnect")').first();
  const msDisconnect = page.locator('div[data-provider="microsoft_365"] >> button:has-text("Disconnect")').first();
  await expect(googleDisconnect).toBeVisible({ timeout: 15000 });
  await expect(msDisconnect).toBeVisible({ timeout: 15000 });
});

test('Weekly Owner Brief displays Workspace signals when connected', async ({ page }) => {
  test.setTimeout(60000);
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  await page.goto(`http://localhost:${PORT}/app/integrations`);
  await performLogin(page);
  
  // Navigate back to integrations page (since login redirects to /app homepage)
  await page.goto(`http://localhost:${PORT}/app/integrations`);
  await page.locator('aside').first().waitFor({ state: 'visible', timeout: 20000 });
  // Wait for Google Workspace card to finish loading and display Disconnect (since Google is pre-connected in the dev seed)
  const googleDisconnect = page.locator('div[data-provider="google_workspace"] >> button:has-text("Disconnect")').first();
  await expect(googleDisconnect).toBeVisible({ timeout: 15000 });

  // Connect Microsoft 365 if not already connected
  const msDisconnect = page.locator('div[data-provider="microsoft_365"] >> button:has-text("Disconnect")').first();
  const isMsConnected = await msDisconnect.isVisible();
  if (!isMsConnected) {
    const msBtn = page.locator('div[data-provider="microsoft_365"] >> button:has-text("Connect")').first();
    await msBtn.click();
    await page.waitForURL(url => url.pathname.includes('/app/integrations'), { timeout: 20000 });
    await page.locator('aside').first().waitFor({ state: 'visible', timeout: 20000 });
    await page.waitForTimeout(2000);
  }

  // Navigate to Owner Brief tab or page
  await page.goto(`http://localhost:${PORT}/app/owner-brief`);
  await page.locator('aside').first().waitFor({ state: 'visible', timeout: 20000 });
  await page.waitForTimeout(2000);
  
  // Verify that Workspace & Communications rollup section shows up
  await expect(page.locator('text="Workspace & Communications"')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('text="Google Workspace:"')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('text="Microsoft 365:"')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('text="Synced Email Messages:"')).toBeVisible({ timeout: 15000 });
});
