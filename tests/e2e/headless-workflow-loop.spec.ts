import { test, expect } from '@playwright/test';
import { spawn, execSync } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3067';

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

test('headless operating loop: create -> notify -> resolve -> complete validation', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  
  // 1. Login
  await page.goto(`http://localhost:${PORT}/login`);
  await page.locator('input[type="email"]').fill('sarah.j@nest-demo.local');
  await page.locator('input[type="password"]').fill('password123');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(`**/app`);

  // Wait for loading screen to disappear
  await expect(page.locator('text=Loading shapework...')).not.toBeVisible({ timeout: 15000 });

  // 2. Create work item
  const createItemRes = await page.request.post(`http://localhost:${PORT}/api/work-items/create`, {
    headers: { 
      'x-workspace-id': 'nest-realty-demo',
      'Origin': `http://localhost:${PORT}`,
      'Referer': `http://localhost:${PORT}/`
    },
    data: {
      title: 'Headless Loop Test Verification',
      type: 'compliance',
      ownerRole: 'compliance_partner',
      priority: 'high',
      recommendedNextAction: 'Nudge to close loops.'
    }
  });
  expect(createItemRes.ok()).toBe(true);
  const createItemData = await createItemRes.json();
  const workItemId = createItemData.workItem.id;

  // 3. Trigger notification manually for E2E flow using u_owner
  const triggerRes = await page.request.post(`http://localhost:${PORT}/api/notifications/trigger`, {
    headers: { 
      'x-workspace-id': 'nest-realty-demo',
      'Origin': `http://localhost:${PORT}`,
      'Referer': `http://localhost:${PORT}/`
    },
    data: {
      recipientId: 'u_owner',
      actionType: 'complete_work_item',
      workItemId,
      contextText: 'Marcus, complete verification task.'
    }
  });
  expect(triggerRes.ok()).toBe(true);
  const triggerData = await triggerRes.json();
  const token = triggerData.token;

  // 4. Land on secure action page and complete task
  await page.goto(`http://localhost:${PORT}/action/${token}`);
  await expect(page.locator('h1:has-text("Headless Loop Test Verification")')).toBeVisible();

  await page.locator('textarea[placeholder*="Write any comments"]').fill('Resolving loops.');
  await page.locator('button:has-text("Complete Task")').click();
  await expect(page.locator('h2:has-text("Submission Successful")')).toBeVisible();

  // 5. Navigate back to workspace console to verify task is resolved in the Completed queue
  await page.goto(`http://localhost:${PORT}/app/work`);
  await page.locator('button:has-text("Completed")').first().click();
  await expect(page.locator(`text=Headless Loop Test Verification`).first()).toBeVisible();
});
