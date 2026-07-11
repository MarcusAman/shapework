import { test, expect } from '@playwright/test';
import { spawn, execSync } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3893';

test.beforeAll(async () => {
  try {
    execSync(`lsof -t -sTCP:LISTEN -i:${PORT} | xargs kill -9`, { stdio: 'ignore' });
  } catch (e) {}

  const dbPath = path.join(process.cwd(), 'data', 'db.json');
  if (fs.existsSync(dbPath)) {
    try { fs.unlinkSync(dbPath); } catch (e) {}
  }

  serverProcess = spawn('npx', ['tsx', 'server.ts'], {
    env: {
      ...process.env,
      RESEND_API_KEY: '',
      TWILIO_ACCOUNT_SID: '',
      TWILIO_AUTH_TOKEN: '',
      APP_MODE: 'production',
      STORAGE_DRIVER: 'local',
      DATABASE_URL: 'mongodb://localhost:27017/shapework-test',
      ADMIN_BOOTSTRAP_SECRET: 'test-secret',
      AUTH_PROVIDER_CONFIGURED: 'true',
      CREDENTIAL_ENCRYPTION_KEY: 'mock_encryption_key_32_characters_long!',
      JWT_SECRET: 'mock_jwt_secret_for_e2e_testing_purposes',
      PASSWORD_RESET_SECRET: 'mock_password_reset_secret_key_32_chars!',
      PORT
    }
  });

  await new Promise((resolve) => setTimeout(resolve, 10000));
});

test.afterAll(async () => {
  if (serverProcess) {
    serverProcess.kill('SIGKILL');
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  try {
    execSync(`lsof -t -sTCP:LISTEN -i:${PORT} | xargs kill -9`, { stdio: 'ignore' });
  } catch (e) {}
});

test('headless full regression console navigation smoke check', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  
  // Login
  await page.goto(`http://localhost:${PORT}/login`);
  await page.locator('input[type="email"]').fill('sarah.j@nest-demo.local');
  await page.locator('input[type="password"]').fill('password123');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(`**/app`);
  await expect(page.locator('text=Loading shapework...')).not.toBeVisible({ timeout: 15000 });

  // 1. Check Today Page
  await page.goto(`http://localhost:${PORT}/app`);
  await expect(page.locator('h1:has-text("Today in the Brokerage")')).toBeVisible();
  
  // Verify only consolidated tabs are displayed in sidebar
  const sidebarText = await page.locator('aside').first().textContent() || '';
  expect(sidebarText).toContain('Workboard');
  expect(sidebarText).toContain('Work Queue');
  expect(sidebarText).toContain('Approvals');
  expect(sidebarText).toContain('Owner Brief');
  expect(sidebarText).toContain('Settings');
  
  // Verify removed items are NOT visible in the customer sidebar
  expect(sidebarText).not.toContain('Command Center');
  expect(sidebarText).not.toContain('Deals');
  expect(sidebarText).not.toContain('Agents');
  expect(sidebarText).not.toContain('Compliance');
  expect(sidebarText).not.toContain('Voice Actions');
  expect(sidebarText).not.toContain('Client Portals');
  expect(sidebarText).not.toContain('Notifications');
  expect(sidebarText).not.toContain('Reports');
  expect(sidebarText).not.toContain('Dev Sandbox');
  expect(sidebarText).not.toContain('Demo Dashboard');

  // 2. Check Work Queue
  await page.goto(`http://localhost:${PORT}/app/work`);
  await expect(page.locator('h1:has-text("Work Queue")')).toBeVisible();

  // 3. Check Approvals
  await page.goto(`http://localhost:${PORT}/app/approvals`);
  await expect(page.locator('h1:has-text("Approvals")')).toBeVisible();

  // 4. Check Owner Brief
  await page.goto(`http://localhost:${PORT}/app/owner-brief`);
  await expect(page.locator('h1:has-text("Owner Brief")')).toBeVisible();

  // 5. Check Settings
  await page.goto(`http://localhost:${PORT}/app/settings`);
  await expect(page.locator('h1:has-text("Settings")')).toBeVisible();
  
  // Check settings groups are displayed
  await expect(page.locator('button:has-text("Workspace Profile")').first()).toBeVisible();
  await expect(page.locator('button:has-text("White-Label Branding")').first()).toBeVisible();
  await expect(page.locator('button:has-text("Workspace Preferences")').first()).toBeVisible();
});
