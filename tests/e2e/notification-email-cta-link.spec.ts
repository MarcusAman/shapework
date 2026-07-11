import { test, expect } from '@playwright/test';
import { spawn, execSync } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3941';

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
      STORAGE_DRIVER: 'local',
      ADMIN_BOOTSTRAP_SECRET: 'test-secret',
      AUTH_PROVIDER_CONFIGURED: 'true',
      CREDENTIAL_ENCRYPTION_KEY: 'mock_encryption_key_32_characters_long!',
      JWT_SECRET: 'mock_jwt_secret_for_e2e_testing_purposes',
      DATABASE_URL: 'mongodb://localhost:27017/shapework-test',
      APP_MODE: 'production',
      PORT
    }
  });

  await new Promise((resolve) => setTimeout(resolve, 8000));
});

test.afterAll(async () => {
  if (serverProcess) {
    serverProcess.kill('SIGKILL');
  }
  try {
    execSync(`lsof -t -sTCP:LISTEN -i:${PORT} | xargs kill -9`, { stdio: 'ignore' });
  } catch (e) {}
});

test('CTA secure link behavior and redirect routing', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });

  // Login
  await page.goto(`http://localhost:${PORT}/login`);
  await page.locator('input[type="email"]').fill('sarah.j@nest-demo.local');
  await page.locator('input[type="password"]').fill('password123');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(`**/app`);

  // Trigger a mock notification for approval 'ap_1'
  const triggerRes = await page.request.post(`http://localhost:${PORT}/api/notifications/trigger`, {
    headers: {
      'x-workspace-id': 'nest-realty-demo',
      'Origin': `http://localhost:${PORT}`,
      'Referer': `http://localhost:${PORT}/`
    },
    data: {
      recipientId: 'u_owner',
      actionType: 'approve_action',
      approvalId: 'ap_1',
      contextText: 'Draft email to lender needs sign-off.'
    }
  });
  
  if (!triggerRes.ok()) {
    console.error('Trigger failed with status:', triggerRes.status(), await triggerRes.text());
  }
  expect(triggerRes.ok()).toBe(true);
  const data = await triggerRes.json();
  const token = data.token;
  expect(token).toBeTruthy();

  // Navigate to the secure link directly
  const actionUrl = `http://localhost:${PORT}/action/${token}`;
  
  // Since 'approve_action' is sensitive, it checks for active session.
  // We navigate to it, it should load the action details or load login redirect if unauthenticated.
  await page.goto(actionUrl);
  await expect(page.locator('text=Approve')).toBeVisible();
  
  // Let's verify that the secure CTA link does not expose raw tokens in logs or dashboards
  const logsRes = await page.context().request.get(`http://localhost:${PORT}/api/notifications/list`, {
    headers: { 'x-workspace-id': 'nest-realty-demo' }
  });
  expect(logsRes.ok()).toBe(true);
  const logsData = await logsRes.json();
  const notifLogs = logsData.notifications;
  
  // Verify raw tokens are masked or omitted in API logs list
  for (const n of notifLogs) {
    expect(n.rawToken).toBeUndefined();
    expect(n.secureActionTokenHash).toBeUndefined();
  }
});
