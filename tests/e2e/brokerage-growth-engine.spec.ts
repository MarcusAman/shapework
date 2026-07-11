import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3555';

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
      JWT_SECRET: 'mock_jwt_secret_for_growth_testing',
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
  await page.waitForURL(url => url.pathname.includes('/login'), { timeout: 15000 }).catch(() => {});
  const emailInput = page.locator('input[type="email"]');
  const passcode = page.locator('input[type="password"]');
  await passcode.waitFor({ state: 'visible', timeout: 15000 });
  
  if (await emailInput.isVisible()) {
    await emailInput.fill('marcus@shapework.co');
    await passcode.fill('shapework2026');
    await page.click('button[type="submit"]');
  } else {
    await passcode.fill('shapework2026');
    await page.click('button[type="submit"]');
  }
  await page.waitForURL(url => url.pathname.startsWith('/app') || url.pathname.startsWith('/demo'), { timeout: 15000 });
}

test('Brokerage Growth Engine - Full Flow', async ({ page }) => {
  test.setTimeout(60000);
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  // 1. Navigate to Growth Engine page
  await page.goto(`http://localhost:${PORT}/app/growth`);
  await performLogin(page);
  
  // Navigate back to growth engine page (since login redirects to dashboard home)
  await page.goto(`http://localhost:${PORT}/app/growth`);
  await page.locator('aside').first().waitFor({ state: 'visible', timeout: 20000 });

  // Verify Page Title
  await expect(page.locator('h1')).toContainText('Brokerage Growth Engine', { timeout: 15000 });

  // 2. Verify sub-tabs presence
  const tabs = ['Agent Recruiting Analytics', 'Growth CRM Pipeline', 'Connected Recruiting Channels'];
  for (const tab of tabs) {
    await expect(page.locator(`button:has-text("${tab}")`)).toBeVisible();
  }

  // 3. Test "Identify Candidate" modal flow
  await page.click('button:has-text("Identify Candidate")');
  await page.locator('input[placeholder="e.g. Sarah Jenkins"]').fill('John Doe');
  await page.locator('input[placeholder="e.g. Compass"]').fill('Keller Williams');
  await page.locator('input[placeholder="e.g. 8500000"]').fill('15000000');
  await page.locator('input[placeholder="sarah@example.com"]').fill('john.doe@kw.com');
  await page.click('button:has-text("Save Candidate")');

  // Verify John Doe appears in list
  await expect(page.locator('text="John Doe"')).toBeVisible({ timeout: 15000 });

  // 4. Navigate to Growth CRM Pipeline sub-tab
  await page.click('button:has-text("Growth CRM Pipeline")');
  await expect(page.locator('text="Prospect Pool"')).toBeVisible();
  await expect(page.locator('text="John Doe"')).toBeVisible();

  // 5. Navigate to Connected Recruiting Channels sub-tab
  await page.click('button:has-text("Connected Recruiting Channels")');
  await expect(page.locator('text="Recruiting Data Channels"')).toBeVisible();
});

test('Brokerage Growth Engine - Custom Tab Navigation', async ({ page }) => {
  test.setTimeout(60000);
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto(`http://localhost:${PORT}/app/growth`);
  await performLogin(page);
  await page.goto(`http://localhost:${PORT}/app/growth`);
  await page.locator('aside').first().waitFor({ state: 'visible', timeout: 20000 });

  // 1. Verify Sequence Builder
  await page.click('div.flex.overflow-x-auto button:has-text("Sequence Builder")');
  await expect(page.locator('text="Campaign Configuration"')).toBeVisible({ timeout: 10000 });

  // 2. Verify Compliance Tab
  await page.click('div.flex.overflow-x-auto button:has-text("Compliance")');
  await expect(page.locator('text="Mailing Suppression List"')).toBeVisible({ timeout: 10000 });

  // 3. Verify Sending Domains Tab
  await page.click('div.flex.overflow-x-auto button:has-text("Sending Domains")');
  await expect(page.locator('text="Setup Custom Domain"')).toBeVisible({ timeout: 10000 });
});


