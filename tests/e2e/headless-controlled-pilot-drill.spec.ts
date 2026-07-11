import { test, expect } from '@playwright/test';
import { spawn, execSync } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3896';

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

test('headless controlled pilot workflow drill', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });

  // Login
  await page.goto(`http://localhost:${PORT}/login`);
  await page.locator('input[type="email"]').fill('sarah.j@nest-demo.local');
  await page.locator('input[type="password"]').fill('password123');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(`**/app`);
  await expect(page.locator('text=Loading shapework...')).not.toBeVisible({ timeout: 15000 });

  // 1. Create a marketing request assigned to marketing_coordinator
  const mktRes = await page.request.post(`http://localhost:${PORT}/api/work-items/create`, {
    headers: { 'x-workspace-id': 'nest-realty-demo' },
    data: {
      title: 'Drill Marketing Flyer Promo',
      type: 'marketing',
      ownerRole: 'marketing_coordinator',
      priority: 'high',
      recommendedNextAction: 'Review agent marketing intake flyer draft.'
    }
  });
  expect(mktRes.ok()).toBe(true);
  const mktData = await mktRes.json();
  const mktItemId = mktData.workItem.id;

  // 2. Confirm notification is queued/sent
  let targetNotif: any = null;
  for (let i = 0; i < 15; i++) {
    const listRes = await page.request.get(`http://localhost:${PORT}/api/notifications/list`);
    const listData = await listRes.json();
    targetNotif = listData.notifications.find((n: any) => n.workItemId === mktItemId);
    if (targetNotif && targetNotif.status === 'sent') {
      break;
    }
    await new Promise(r => setTimeout(r, 200));
  }
  expect(targetNotif).toBeDefined();

  // Retrieve token from internal trigger for the spec
  const triggerRes = await page.request.post(`http://localhost:${PORT}/api/notifications/trigger`, {
    headers: { 'x-workspace-id': 'nest-realty-demo' },
    data: {
      recipientId: 'u_owner',
      actionType: 'complete_work_item',
      workItemId: mktItemId,
      contextText: 'Marcus, approve flyer promo.'
    }
  });
  const triggerData = await triggerRes.json();
  const token = triggerData.token;

  // 3. Open secure action link & 4. Complete task
  await page.goto(`http://localhost:${PORT}/action/${token}`);
  await expect(page.locator('h1')).toContainText('Drill Marketing Flyer Promo');
  await page.locator('textarea[placeholder*="Write any comments"]').fill('Drill completion notes.');
  await page.locator('button:has-text("Complete Task")').click();
  await expect(page.locator('h2:has-text("Submission Successful")')).toBeVisible();

  // 5. Confirm Work page updates (view in Completed queue)
  await page.goto(`http://localhost:${PORT}/app/work-queue`);
  await page.locator('button:has-text("Completed")').first().click();
  await expect(page.locator('text=Drill Marketing Flyer Promo').first()).toBeVisible();

  // 6. Confirm Audit event appears
  const stateRes = await page.request.get(`http://localhost:${PORT}/api/db-state`);
  const dbState = await stateRes.json();
  const auditLogs = dbState.auditEvents || [];
  const mktAudit = auditLogs.find((a: any) => a.impact_area === 'notifications' && a.action_details.includes('Completed work item "Drill Marketing Flyer Promo"'));
  expect(mktAudit).toBeDefined();

  // 7. Create signage signage request
  const signRes = await page.request.post(`http://localhost:${PORT}/api/work-items/create`, {
    headers: { 'x-workspace-id': 'nest-realty-demo' },
    data: {
      title: 'Signage Lockbox Deployment',
      type: 'office_signage',
      ownerRole: 'maintenance',
      priority: 'high',
      recommendedNextAction: 'Install lockbox and directional signage.'
    }
  });
  expect(signRes.ok()).toBe(true);
  const signData = await signRes.json();
  const signItemId = signData.workItem.id;

  // 8. Confirm no duplicate notifications are sent within active cooldown window
  const duplicateTrigger = await page.request.post(`http://localhost:${PORT}/api/notifications/trigger`, {
    headers: { 'x-workspace-id': 'nest-realty-demo' },
    data: {
      recipientId: 'u_owner',
      actionType: 'complete_work_item',
      workItemId: signItemId,
      contextText: 'Nudge signage.'
    }
  });
  expect(duplicateTrigger.ok()).toBe(true);

  // Immediate second duplicate trigger must fail with 400
  const spamTrigger = await page.request.post(`http://localhost:${PORT}/api/notifications/trigger`, {
    headers: { 'x-workspace-id': 'nest-realty-demo' },
    data: {
      recipientId: 'u_owner',
      actionType: 'complete_work_item',
      workItemId: signItemId,
      contextText: 'Nudge signage.'
    }
  });
  expect(spamTrigger.status()).toBe(400);
});
