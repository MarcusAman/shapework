import { test, expect } from '@playwright/test';
import { spawn, execSync } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3065';

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

test('automated notification trigger rules for work item lifecycle events', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  
  // Login
  await page.goto(`http://localhost:${PORT}/login`);
  await page.locator('input[type="email"]').fill('sarah.j@nest-demo.local');
  await page.locator('input[type="password"]').fill('password123');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(`**/app`);

  // Wait for loading screen to disappear
  await expect(page.locator('text=Loading shapework...')).not.toBeVisible({ timeout: 15000 });

  // Clear notifications array in system settings if needed, or check listing length
  const initialNotifsRes = await page.request.get(`http://localhost:${PORT}/api/notifications/list`);
  expect(initialNotifsRes.ok()).toBe(true);
  const initialNotifsData = await initialNotifsRes.json();
  const initialCount = initialNotifsData.notifications.length;

  // 1. Create a work item assigned to operations_lead
  const createItemRes = await page.request.post(`http://localhost:${PORT}/api/work-items/create`, {
    headers: { 
      'x-workspace-id': 'nest-realty-demo',
      'Origin': `http://localhost:${PORT}`,
      'Referer': `http://localhost:${PORT}/`
    },
    data: {
      title: 'E2E Test Compliance Document Audit',
      type: 'compliance',
      ownerRole: 'operations_lead',
      priority: 'high',
      recommendedNextAction: 'Review documents for E2E compliance validation.'
    }
  });
  expect(createItemRes.ok()).toBe(true);
  const createItemData = await createItemRes.json();
  const workItemId = createItemData.workItem.id;

  // Poll list of notifications to wait for the async trigger hook to complete
  let targetNotif: any = null;
  for (let i = 0; i < 20; i++) {
    const listRes = await page.request.get(`http://localhost:${PORT}/api/notifications/list`);
    expect(listRes.ok()).toBe(true);
    const listData = await listRes.json();
    targetNotif = listData.notifications.find((n: any) => n.workItemId === workItemId);
    if (targetNotif && targetNotif.status === 'sent') {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  // Verify trigger successfully dispatched a notification to operations_lead (Ann Gunn)
  expect(targetNotif).toBeDefined();
  expect(targetNotif.recipientName).toBe('Ann Gunn'); // Ann is operations lead in default seeds
  expect(targetNotif.status).toBe('sent');
});
