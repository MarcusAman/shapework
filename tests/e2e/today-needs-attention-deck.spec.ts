import { test, expect } from '@playwright/test';
import { spawn, execSync } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3910';

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

test('today needs attention deck: card rendering and elements', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });

  // Login
  await page.goto(`http://localhost:${PORT}/login`);
  await page.locator('input[type="email"]').fill('sarah.j@nest-demo.local');
  await page.locator('input[type="password"]').fill('password123');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(`**/app`);
  await expect(page.locator('text=Loading shapework...')).not.toBeVisible({ timeout: 15000 });

  // Verify Needs Attention deck is visible
  const deckTitle = page.locator('h3:has-text("Needs Attention")');
  await expect(deckTitle).toBeVisible();

  // Find cards
  const cards = page.locator('.attention-card');
  expect(await cards.count()).toBeGreaterThan(0);

  // Validate front card layout details
  const activeCard = page.locator('.attention-card-front');
  await expect(activeCard).toBeVisible();

  // Validate elements of the card (Title, Priority, Assigned To, Recommended Next Action)
  await expect(activeCard.locator('h3')).toBeVisible();
  await expect(activeCard.locator('text=Assigned to')).toBeVisible();
  await expect(activeCard.locator('text=Recommended Next Action')).toBeVisible();
  await expect(activeCard.locator('button:has-text("Not now")')).toBeVisible();
  await expect(activeCard.locator('button:has-text("Review details")').or(activeCard.locator('button:has-text("Open full task")')).or(activeCard.locator('button:has-text("Open item")'))).toBeVisible();
  await expect(activeCard.locator('button:has-text("Resolve issue")').or(activeCard.locator('button:has-text("Request missing info")')).or(activeCard.locator('button:has-text("Take action")'))).toBeVisible();
});
