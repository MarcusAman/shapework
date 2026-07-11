import { test, expect } from '@playwright/test';
import { spawn, execSync } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3066';

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

test('spam prevention and duplicate notification cooldown controls', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  
  // Login
  await page.goto(`http://localhost:${PORT}/login`);
  await page.locator('input[type="email"]').fill('sarah.j@nest-demo.local');
  await page.locator('input[type="password"]').fill('password123');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(`**/app`);

  // Wait for loading screen to disappear
  await expect(page.locator('text=Loading shapework...')).not.toBeVisible({ timeout: 15000 });

  // 1. Dispatch first trigger (using u_owner)
  const res1 = await page.request.post(`http://localhost:${PORT}/api/notifications/trigger`, {
    headers: { 
      'x-workspace-id': 'nest-realty-demo',
      'Origin': `http://localhost:${PORT}`,
      'Referer': `http://localhost:${PORT}/`
    },
    data: {
      recipientId: 'u_owner',
      actionType: 'complete_work_item',
      workItemId: 'wi_2',
      contextText: 'Nudge task'
    }
  });
  expect(res1.ok()).toBe(true);
  const res1Body = await res1.text();
  console.log("=== FIRST TRIGGER RESPONSE ===");
  console.log(res1Body);

  // 2. Dispatch duplicate trigger immediately
  const res2 = await page.request.post(`http://localhost:${PORT}/api/notifications/trigger`, {
    headers: { 
      'x-workspace-id': 'nest-realty-demo',
      'Origin': `http://localhost:${PORT}`,
      'Referer': `http://localhost:${PORT}/`
    },
    data: {
      recipientId: 'u_owner',
      actionType: 'complete_work_item',
      workItemId: 'wi_2',
      contextText: 'Nudge task'
    }
  });

  const res2Body = await res2.text();
  console.log("=== SECOND TRIGGER RESPONSE ===");
  console.log(`STATUS: ${res2.status()} BODY: ${res2Body}`);

  // Second trigger should fail or report suppression due to cooldown
  expect(res2.status()).toBe(400);
  const data2 = JSON.parse(res2Body);
  expect(data2.success).toBe(false);
  expect(data2.error).toContain('supressed');
});
