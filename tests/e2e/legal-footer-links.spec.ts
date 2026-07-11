import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3152';

test.beforeAll(async () => {
  const dbPath = path.join(process.cwd(), 'data', 'db.json');
  if (fs.existsSync(dbPath)) {
    try {
      fs.unlinkSync(dbPath);
    } catch (e) {}
  }

  serverProcess = spawn('npx', ['tsx', 'server.ts'], {
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

  await new Promise((resolve) => setTimeout(resolve, 8000));
});

test.afterAll(async () => {
  if (serverProcess) {
    serverProcess.kill('SIGKILL');
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
});

test('Legal Footers - Verify landing page footer links to Terms and Privacy', async ({ page }) => {
  await page.goto(`http://localhost:${PORT}/`);

  // Verify Legal column and links exist in footer
  const termsFooterBtn = page.locator('footer button:has-text("Terms")');
  await expect(termsFooterBtn).toBeVisible({ timeout: 15000 });
  await termsFooterBtn.click();
  await page.waitForURL(`http://localhost:${PORT}/terms`);
  expect(page.url()).toBe(`http://localhost:${PORT}/terms`);

  await page.goto(`http://localhost:${PORT}/`);
  const privacyFooterBtn = page.locator('footer button:has-text("Privacy")');
  await expect(privacyFooterBtn).toBeVisible();
  await privacyFooterBtn.click();
  await page.waitForURL(`http://localhost:${PORT}/privacy`);
  expect(page.url()).toBe(`http://localhost:${PORT}/privacy`);
});

test('Legal Footers - Verify login page footer contains correct links', async ({ page }) => {
  await page.goto(`http://localhost:${PORT}/login`);

  // Verify Privacy Policy & Terms buttons exist on login page card
  const privacyBtn = page.locator('main button:has-text("Privacy Policy")');
  const termsBtn = page.locator('main button:has-text("Terms")');
  await expect(privacyBtn).toBeVisible({ timeout: 15000 });
  await expect(termsBtn).toBeVisible();

  // Test navigation
  await privacyBtn.click();
  await page.waitForURL(`http://localhost:${PORT}/privacy`);
  expect(page.url()).toBe(`http://localhost:${PORT}/privacy`);
});

test('Legal Footers - Verify discovery request form includes Terms/Privacy statement', async ({ page }) => {
  await page.goto(`http://localhost:${PORT}/discovery`);

  // Verify form has the legal acknowledgment paragraph
  const legalText = page.locator('text=By submitting this form, you agree to our Terms and acknowledge our Privacy Policy.');
  await expect(legalText).toBeVisible({ timeout: 15000 });

  // Verify clicking "Terms" link routes to /terms
  const termsFormBtn = page.locator('button:has-text("Terms")').first();
  await termsFormBtn.click();
  await page.waitForURL(`http://localhost:${PORT}/terms`);
  expect(page.url()).toBe(`http://localhost:${PORT}/terms`);
});
