import { test, expect } from '@playwright/test';
import { spawn, execSync } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3064';

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

test('secure notification focused action link flow', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  
  // Login to get a valid session
  await page.goto(`http://localhost:${PORT}/login`);
  await page.locator('input[type="email"]').fill('sarah.j@nest-demo.local');
  await page.locator('input[type="password"]').fill('password123');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(`**/app`);

  // Wait for loading screen to disappear
  await expect(page.locator('text=Loading shapework...')).not.toBeVisible({ timeout: 15000 });

  // 1. Create a work item dynamically first
  const createItemRes = await page.request.post(`http://localhost:${PORT}/api/work-items/create`, {
    headers: { 
      'x-workspace-id': 'nest-realty-demo',
      'Origin': `http://localhost:${PORT}`,
      'Referer': `http://localhost:${PORT}/`
    },
    data: {
      title: 'Action Link Test Document Review',
      type: 'compliance',
      ownerRole: 'operations_lead',
      priority: 'high',
      recommendedNextAction: 'Review documents for E2E compliance validation.'
    }
  });
  expect(createItemRes.ok()).toBe(true);
  const createItemData = await createItemRes.json();
  const workItemId = createItemData.workItem.id;

  // 2. Trigger a test notification via page.request using u_owner (Marcus Aman) as the recipient
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
      contextText: 'Marcus, please complete Bruce Wayne missing closing date.'
    }
  });

  expect(triggerRes.ok()).toBe(true);
  const triggerData = await triggerRes.json();
  const token = triggerData.token;
  expect(token).toBeDefined();

  // Navigate to secure action landing page
  await page.goto(`http://localhost:${PORT}/action/${token}`);

  // Assert focused page content
  await expect(page.locator('span:has-text("shapework.")')).toBeVisible();
  await expect(page.locator('span:has-text("Action Needed")')).toBeVisible();
  await expect(page.locator('h1:has-text("Action Link Test Document Review")')).toBeVisible();

  // Enter comment note
  await page.locator('textarea[placeholder*="Write any comments"]').fill('Done via secure E2E action link.');
  
  // Submit action completion
  await page.locator('button:has-text("Complete Task")').click();

  // Assert successful completion
  await expect(page.locator('h2:has-text("Submission Successful")')).toBeVisible();
});
