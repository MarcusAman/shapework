import { test, expect } from '@playwright/test';
import { spawn, execSync } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3061';

test.beforeAll(async () => {
  // Kill only the listening process on this port
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

test('simplified navigation rail and settings categories', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`http://localhost:${PORT}/login`);
  await page.locator('input[type="email"]').fill('sarah.j@nest-demo.local');
  await page.locator('input[type="password"]').fill('password123');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(`**/app/workboard`);

  // Wait for loading screen to disappear
  await expect(page.locator('text=Loading shapework...')).not.toBeVisible({ timeout: 15000 });

  // Verify exactly the new brokerage rails: Workboard, Work Queue, Approvals, Owner Brief, Settings
  const navContainer = page.locator('aside').first();
  await expect(navContainer.locator('button[aria-label="Workboard"]')).toBeVisible();
  await expect(navContainer.locator('button[aria-label="Work Queue"]')).toBeVisible();
  await expect(navContainer.locator('button[aria-label="Approvals"]')).toBeVisible();
  await expect(navContainer.locator('button[aria-label="Owner Brief"]')).toBeVisible();
  await expect(navContainer.locator('button[aria-label="Settings"]')).toBeVisible();

  // Verify removed items are NOT visible in the customer sidebar
  await expect(navContainer.locator('button[aria-label="Deals"]')).not.toBeVisible();
  await expect(navContainer.locator('button[aria-label="Agents"]')).not.toBeVisible();
  await expect(navContainer.locator('button[aria-label="Compliance"]')).not.toBeVisible();
  await expect(navContainer.locator('button[aria-label="Voice Actions"]')).not.toBeVisible();
  await expect(navContainer.locator('button[aria-label="Client Portals"]')).not.toBeVisible();
  await expect(navContainer.locator('button[aria-label="Notifications"]')).not.toBeVisible();

  // Navigate to Settings
  await navContainer.locator('button[aria-label="Settings"]').click();
  await page.waitForURL(`**/app/settings`);

  // Verify Consolidated Settings categories are visible
  await expect(page.locator('button:has-text("Workspace Profile")').first()).toBeVisible();
  await expect(page.locator('button:has-text("White-Label Branding")').first()).toBeVisible();
  await expect(page.locator('button:has-text("Workspace Preferences")').first()).toBeVisible();
});
