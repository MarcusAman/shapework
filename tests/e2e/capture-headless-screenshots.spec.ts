import { test, expect } from '@playwright/test';
import { spawn, execSync } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3892';

test.beforeAll(async () => {
  // Kill processes listening on this port
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

test('Capture Headless Operating Layer Screenshots', async ({ page }) => {
  test.setTimeout(80000);

  const projectScreenshotDir = '/Users/marcusaman/Downloads/shapework (2)/docs/audit/screenshots';
  const artifactScreenshotDir = '/Users/marcusaman/.gemini/antigravity/brain/0b638d05-d187-4a6a-8c3d-6109272acb07/screenshots';

  for (const dir of [projectScreenshotDir, artifactScreenshotDir]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // 1. Perform Login
  await page.goto(`http://localhost:${PORT}/login`);
  await page.locator('input[type="email"]').fill('sarah.j@nest-demo.local');
  await page.locator('input[type="password"]').fill('password123');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(`**/app`);
  await expect(page.locator('text=Loading shapework...')).not.toBeVisible({ timeout: 15000 });

  // 2. Screenshot Today Dashboard
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`http://localhost:${PORT}/app`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(projectScreenshotDir, 'headless-today-desktop.png') });
  await page.screenshot({ path: path.join(artifactScreenshotDir, 'headless-today-desktop.png') });

  // 3. Screenshot Work Queue Desktop
  await page.goto(`http://localhost:${PORT}/app/work-queue`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(projectScreenshotDir, 'headless-work-desktop.png') });
  await page.screenshot({ path: path.join(artifactScreenshotDir, 'headless-work-desktop.png') });

  // 4. Screenshot Work Detail Drawer (click first row)
  await page.locator('tbody tr').first().click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(projectScreenshotDir, 'headless-work-detail-drawer.png') });
  await page.screenshot({ path: path.join(artifactScreenshotDir, 'headless-work-detail-drawer.png') });

  // 5. Screenshot Approvals Page
  await page.goto(`http://localhost:${PORT}/app/approvals`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(projectScreenshotDir, 'headless-approvals-desktop.png') });
  await page.screenshot({ path: path.join(artifactScreenshotDir, 'headless-approvals-desktop.png') });

  // 6. Screenshot Owner Brief Page
  await page.goto(`http://localhost:${PORT}/app/owner-brief`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(projectScreenshotDir, 'headless-owner-brief-desktop.png') });
  await page.screenshot({ path: path.join(artifactScreenshotDir, 'headless-owner-brief-desktop.png') });

  // 7. Screenshot Settings - Notification Rules panel
  await page.goto(`http://localhost:${PORT}/app/settings`);
  await page.waitForTimeout(1000);
  await page.locator('button:has-text("Notification Rules")').click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(projectScreenshotDir, 'headless-settings-notification-rules.png') });
  await page.screenshot({ path: path.join(artifactScreenshotDir, 'headless-settings-notification-rules.png') });

  // 8. Generate token & screenshot secure action link (Desktop & Mobile)
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
      contextText: 'Screenshot verification task.'
    }
  });
  expect(triggerRes.ok()).toBe(true);
  const triggerData = await triggerRes.json();
  const token = triggerData.token;

  await page.goto(`http://localhost:${PORT}/action/${token}`);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(projectScreenshotDir, 'headless-action-link-page.png') });
  await page.screenshot({ path: path.join(artifactScreenshotDir, 'headless-action-link-page.png') });

  await page.setViewportSize({ width: 375, height: 800 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(projectScreenshotDir, 'headless-action-link-mobile.png') });
  await page.screenshot({ path: path.join(artifactScreenshotDir, 'headless-action-link-mobile.png') });
});
