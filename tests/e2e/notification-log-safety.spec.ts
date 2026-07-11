import { test, expect } from '@playwright/test';
import { spawn, execSync } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3894';

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

test('notification logs mask PII and leak zero tokens/hashes', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  
  // Login
  await page.goto(`http://localhost:${PORT}/login`);
  await page.locator('input[type="email"]').fill('sarah.j@nest-demo.local');
  await page.locator('input[type="password"]').fill('password123');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(`**/app`);
  await expect(page.locator('text=Loading shapework...')).not.toBeVisible({ timeout: 15000 });

  // 1. Trigger a notification
  const triggerRes = await page.request.post(`http://localhost:${PORT}/api/notifications/trigger`, {
    headers: { 
      'x-workspace-id': 'nest-realty-demo',
      'Origin': `http://localhost:${PORT}`,
      'Referer': `http://localhost:${PORT}/`
    },
    data: {
      recipientId: 'u_owner',
      actionType: 'complete_work_item',
      workItemId: 'wi_gen_owner_worthy_decision_ap_1',
      contextText: 'Checking log safety audit.'
    }
  });
  expect(triggerRes.ok()).toBe(true);

  // 2. Fetch the notification log list via endpoint
  const listRes = await page.request.get(`http://localhost:${PORT}/api/notifications/list`);
  expect(listRes.ok()).toBe(true);
  const data = await listRes.json();
  expect(data.success).toBe(true);
  expect(data.notifications.length).toBeGreaterThan(0);

  // 3. Assert safety constraints on the log payload
  for (const notif of data.notifications) {
    // Basic descriptors present
    expect(notif.recipientName).toBeDefined();
    expect(notif.channel).toBeDefined();
    expect(notif.status).toBeDefined();

    // Sensitive properties must be completely absent or masked
    expect(notif.recipientEmail).toContain('*');
    if (notif.recipientPhone) {
      expect(notif.recipientPhone).toContain('*');
    }

    // Cryptographic token details and raw URLs must never be in list logs
    expect(notif.rawToken).toBeUndefined();
    expect(notif.token).toBeUndefined();
    expect(notif.secureActionTokenHash).toBeUndefined();
    expect(notif.bodyHtml).toBeUndefined();
    expect(notif.bodyText).toBeUndefined();
    expect(notif.subject).toBeUndefined();
  }
});
