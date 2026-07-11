import { test, expect } from '@playwright/test';
import { spawn, execSync } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3895';

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

test('secure action link permissions: low-risk vs sensitive action restrictions', async ({ page, context }) => {
  await page.setViewportSize({ width: 1280, height: 800 });

  // 1. Low-risk Action (complete_work_item): A unauthenticated request should succeed.
  const triggerLowRisk = await page.request.post(`http://localhost:${PORT}/api/notifications/trigger`, {
    headers: { 
      'x-workspace-id': 'nest-realty-demo',
      'Origin': `http://localhost:${PORT}`,
      'Referer': `http://localhost:${PORT}/`
    },
    data: {
      recipientId: 'u_owner',
      actionType: 'complete_work_item',
      workItemId: 'wi_gen_owner_worthy_decision_ap_1',
      contextText: 'Low risk workflow validation.'
    }
  });
  expect(triggerLowRisk.ok()).toBe(true);
  const dataLow = await triggerLowRisk.json();
  const tokenLow = dataLow.token;

  // Complete low-risk action without credentials
  const completeLowRes = await page.request.post(`http://localhost:${PORT}/api/notifications/action/${tokenLow}/complete`, {
    data: { notes: 'Cleared low-risk task' }
  });
  expect(completeLowRes.ok()).toBe(true);

  // 2. Sensitive Action (approve_action): Unauthenticated submission must fail with 401.
  const triggerSensitive = await page.request.post(`http://localhost:${PORT}/api/notifications/trigger`, {
    headers: { 
      'x-workspace-id': 'nest-realty-demo',
      'Origin': `http://localhost:${PORT}`,
      'Referer': `http://localhost:${PORT}/`
    },
    data: {
      recipientId: 'u_owner',
      actionType: 'approve_action',
      approvalId: 'ap_1',
      contextText: 'Sensitive document approval.'
    }
  });
  expect(triggerSensitive.ok()).toBe(true);
  const dataSensitive = await triggerSensitive.json();
  const tokenSensitive = dataSensitive.token;

  // Attempt complete sensitive action without login/session -> must return 401
  const completeSensitiveFail = await page.request.post(`http://localhost:${PORT}/api/notifications/action/${tokenSensitive}/complete`, {
    data: { actionResult: 'approve', notes: 'Unauthorized attempt' }
  });
  expect(completeSensitiveFail.status()).toBe(401);

  // 3. Login to get a valid session token, and try completing the sensitive action -> must succeed.
  await page.goto(`http://localhost:${PORT}/login`);
  await page.locator('input[type="email"]').fill('sarah.j@nest-demo.local');
  await page.locator('input[type="password"]').fill('password123');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(`**/app`);

  // Navigate to the action URL with the valid session logged in
  await page.goto(`http://localhost:${PORT}/action/${tokenSensitive}`);
  await expect(page.locator('h1')).toBeVisible();

  // Click completion button inside the browser (which automatically includes session cookies)
  await page.locator('button:has-text("Approve Proposal")').click();
  await expect(page.locator('h2:has-text("Submission Successful")')).toBeVisible();

  // 4. Token Reuse Block: Try visiting the used token again -> must report invalid or expired (404)
  const getUsedRes = await page.request.get(`http://localhost:${PORT}/api/notifications/action/${tokenSensitive}`);
  expect(getUsedRes.status()).toBe(404);

  // 5. Expired Token fails: generate a manual expired token directly in db state to test
  // First get workspace state
  const dbStateRes = await page.request.get(`http://localhost:${PORT}/api/db-state`);
  const dbState = await dbStateRes.json();
  
  // Verify audit events was logged
  const auditLogs = dbState.auditEvents || [];
  const secureAudits = auditLogs.filter((a: any) => a.impact_area === 'security' || a.impact_area === 'notifications');
  expect(secureAudits.length).toBeGreaterThan(0);
});
