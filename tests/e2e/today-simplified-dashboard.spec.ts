import { test, expect } from '@playwright/test';
import { spawn, execSync } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3063';

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

test('Today simplified dashboard sections and navigation action', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`http://localhost:${PORT}/login`);
  await page.locator('input[type="email"]').fill('sarah.j@nest-demo.local');
  await page.locator('input[type="password"]').fill('password123');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(`**/app`);

  // Wait for loading screen to disappear
  await expect(page.locator('text=Loading shapework...')).not.toBeVisible({ timeout: 15000 });

  // Verify dashboard lists exist as tabs in the navigation deck
  await expect(page.locator('button:has-text("Needs Attention")').or(page.locator('button:has-text("Needs attention")'))).toBeVisible();
  await expect(page.locator('button:has-text("Due Soon")').or(page.locator('button:has-text("Due soon")'))).toBeVisible();
  await expect(page.locator('button:has-text("Blocked Items")').or(page.locator('button:has-text("Blocked")'))).toBeVisible();
  await expect(page.locator('button:has-text("Needs Approval")').or(page.locator('button:has-text("Needs approval")'))).toBeVisible();
  await expect(page.locator('button:has-text("Recently Completed")').or(page.locator('button:has-text("Recently completed")')).or(page.locator('button:has-text("Completed")'))).toBeVisible();
  await expect(page.locator('button:has-text("All Items")').or(page.locator('button:has-text("All work")'))).toBeVisible();

  // Verify Owner Brief Preview panel is visible
  await expect(page.locator('text=Owner Brief Preview')).toBeVisible();
  await expect(page.locator('text=View Full Owner Brief')).toBeVisible();

  // Click View Full Owner Brief and verify it redirects/changes tab to Owner Brief
  await page.locator('text=View Full Owner Brief').click();
  await page.waitForURL(`**/app/owner-brief`);
  expect(page.url()).toContain('/owner-brief');
});
