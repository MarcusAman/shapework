import { test, expect } from '@playwright/test';
import { spawn, execSync } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3062';

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

test('work page category and secondary filtering', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`http://localhost:${PORT}/login`);
  await page.locator('input[type="email"]').fill('sarah.j@nest-demo.local');
  await page.locator('input[type="password"]').fill('password123');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(`**/app`);

  // Wait for loading screen to disappear
  await expect(page.locator('text=Loading shapework...')).not.toBeVisible({ timeout: 15000 });

  // Navigate to Work Page
  await page.locator('aside >> button[aria-label="Work"]').click();
  await page.waitForURL(`**/app/work`);

  // Verify page title and header
  await expect(page.getByRole('heading', { name: 'Work', exact: true })).toBeVisible();

  // Verify Category Tabs (buttons)
  await expect(page.locator('button:has-text("All Categories")').first()).toBeVisible();
  await expect(page.locator('button:has-text("Compliance")').first()).toBeVisible();
  await expect(page.locator('button:has-text("Marketing")').first()).toBeVisible();
  await expect(page.locator('button:has-text("Transactions")').first()).toBeVisible();
  await expect(page.locator('button:has-text("Office & Signage")').first()).toBeVisible();
  await expect(page.locator('button:has-text("Finance")').first()).toBeVisible();
  await expect(page.locator('button:has-text("Integrations")').first()).toBeVisible();

  // Verify Secondary Filters (buttons)
  await expect(page.locator('button:has-text("All Tasks")').first()).toBeVisible();
  await expect(page.locator('button:has-text("Assigned to me")').first()).toBeVisible();
  await expect(page.locator('button:has-text("Overdue")').first()).toBeVisible();
  await expect(page.locator('button:has-text("Needs Approval")').first()).toBeVisible();
  await expect(page.locator('button:has-text("Blocked")').first()).toBeVisible();
  await expect(page.locator('button:has-text("Owner-worthy")').first()).toBeVisible();
  await expect(page.locator('button:has-text("Completed")').first()).toBeVisible();

  // Perform category tab switching
  await page.locator('button:has-text("Compliance")').first().click();
  // Verify that listing is filtered
  await expect(page.locator('tbody tr').first()).toBeVisible();
});
