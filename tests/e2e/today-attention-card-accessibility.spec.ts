import { test, expect } from '@playwright/test';
import { spawn, execSync } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3913';

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

test('today needs attention deck: accessibility features', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });

  // Login
  await page.goto(`http://localhost:${PORT}/login`);
  await page.locator('input[type="email"]').fill('sarah.j@nest-demo.local');
  await page.locator('input[type="password"]').fill('password123');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(`**/app`);
  await expect(page.locator('text=Loading shapework...')).not.toBeVisible({ timeout: 15000 });

  // Verify navigation buttons for the deck exist and are focusable
  const prevBtn = page.locator('button[aria-label="Previous card"]');
  const nextBtn = page.locator('button[aria-label="Next card"]');
  await expect(prevBtn).toBeVisible();
  await expect(nextBtn).toBeVisible();

  // Test Keyboard Arrow navigation
  const firstCardTitle = await page.locator('.attention-card-front').locator('h3').textContent();
  
  // Press Right arrow key -> should cycle to the next card
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(300);
  const secondCardTitle = await page.locator('.attention-card-front').locator('h3').textContent();
  
  if (firstCardTitle !== secondCardTitle) {
    expect(secondCardTitle).not.toBe(firstCardTitle);
    
    // Press Left arrow key -> should cycle back to the first card
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(300);
    const restoredCardTitle = await page.locator('.attention-card-front').locator('h3').textContent();
    expect(restoredCardTitle).toBe(firstCardTitle);
  }

  // Verify buttons inside the card have clear labels
  const firstCard = page.locator('.attention-card-front');
  await expect(firstCard.locator('button[aria-label="Snooze item"]')).toBeVisible();
  await expect(firstCard.locator('button[aria-label="Review details"]').or(firstCard.locator('button[aria-label="Open full task"]')).or(firstCard.locator('button[aria-label="Open item details"]'))).toBeVisible();
  await expect(firstCard.locator('button[aria-label="Resolve issue"]').or(firstCard.locator('button[aria-label="Request missing info"]')).or(firstCard.locator('button[aria-label="Take action on item"]'))).toBeVisible();
});
