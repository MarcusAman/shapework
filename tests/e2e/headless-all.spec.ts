import { test, expect } from '@playwright/test';
import { spawn, execSync } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3075';

test.beforeAll(async () => {
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
      SMS_PROVIDER: 'dev_log',
      SMS_TEST_ALLOWLIST: '+15555555555',
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
  }
  try {
    execSync(`lsof -t -sTCP:LISTEN -i:${PORT} | xargs kill -9`, { stdio: 'ignore' });
  } catch (e) {}
});

test.describe('Headless Brokerage OS E2E Suite', () => {
  test('1. SMS Delivery and DevLog/Allowlist provider modes', async ({ page }) => {
    // Login
    await page.goto(`http://127.0.0.1:${PORT}/login`);
    await page.locator('input[type="email"]').fill('sarah.j@nest-demo.local');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(`**/app`);

    // Trigger notification manually with CSRF headers
    const triggerRes = await page.request.post(`http://127.0.0.1:${PORT}/api/notifications/trigger`, {
      headers: {
        'Origin': `http://127.0.0.1:${PORT}`,
        'Referer': `http://127.0.0.1:${PORT}/`
      },
      data: {
        recipientId: 'u_owner',
        actionType: 'approval_needed',
        contextText: 'Audit verify link'
      }
    });
    expect(triggerRes.ok()).toBe(true);

    // Fetch notification log list
    const listRes = await page.request.get(`http://127.0.0.1:${PORT}/api/notifications/list`);
    expect(listRes.ok()).toBe(true);
    const data = await listRes.json();
    expect(data.notifications.length).toBeGreaterThan(0);
  });

  test('2. Owner Shield deflection and metric updates', async ({ page }) => {
    // Verify Owner Shield metrics
    const shieldRes = await page.request.get(`http://127.0.0.1:${PORT}/api/headless/owner-shield`);
    expect(shieldRes.ok()).toBe(true);
    const data = await shieldRes.json();
    expect(data.success).toBe(true);
    expect(data.metrics.routedToStaffCount).toBeGreaterThanOrEqual(4);
  });

  test('3. AI Triage classification accuracy', async ({ page }) => {
    // Legal threat dispute classification with CSRF headers
    const disputeRes = await page.request.post(`http://127.0.0.1:${PORT}/api/headless/triage/classify`, {
      headers: {
        'Origin': `http://127.0.0.1:${PORT}`,
        'Referer': `http://127.0.0.1:${PORT}/`
      },
      data: { signalText: 'We are facing a potential lawsuit regarding listing commission disputes' }
    });
    expect(disputeRes.ok()).toBe(true);
    const disputeData = await disputeRes.json();
    expect(disputeData.success).toBe(true);
    expect(disputeData.classification.category).toBe('dispute');
    expect(disputeData.classification.suggestedPriority).toBe('critical');

    // Marketing signal classification with CSRF headers
    const marketingRes = await page.request.post(`http://127.0.0.1:${PORT}/api/headless/triage/classify`, {
      headers: {
        'Origin': `http://127.0.0.1:${PORT}`,
        'Referer': `http://127.0.0.1:${PORT}/`
      },
      data: { signalText: 'Please compile the new marketing flyer and photos' }
    });
    expect(marketingRes.ok()).toBe(true);
    const marketingData = await marketingRes.json();
    expect(marketingData.success).toBe(true);
    expect(marketingData.classification.category).toBe('marketing');
  });

  test('4. Smart Intake submission and Work Item queue insertion', async ({ page }) => {
    const submitRes = await page.request.post(`http://127.0.0.1:${PORT}/api/headless/intake/submit`, {
      headers: {
        'Origin': `http://127.0.0.1:${PORT}`,
        'Referer': `http://127.0.0.1:${PORT}/`
      },
      data: {
        title: 'E2E Flyers Intake Test',
        description: 'Photos and flyer layout',
        type: 'marketing'
      }
    });
    expect(submitRes.ok()).toBe(true);
    const data = await submitRes.json();
    expect(data.success).toBe(true);
    expect(data.workItemId).toBeDefined();

    // Login to verify item in queue
    await page.goto(`http://127.0.0.1:${PORT}/login`);
    await page.locator('input[type="email"]').fill('sarah.j@nest-demo.local');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(`**/app`);
    const listData = await page.evaluate(() => fetch('/api/db-state', {
      headers: { 'x-workspace-id': 'nest-realty-demo' }
    }).then(r => r.json()));
    const matched = listData.workItems.find((w: any) => w.id === data.workItemId);
    expect(matched).toBeDefined();
    expect(matched.title).toBe('E2E Flyers Intake Test');
  });

  test('5. Branded client portal and smart intake link page renders', async ({ page }) => {
    // Visit Client Deal Portal
    await page.goto(`http://127.0.0.1:${PORT}/client/deal/mock-client-deal-token`);
    await page.waitForTimeout(2000);
    await expect(page.locator('text=Client Deal Portal')).toBeVisible();

    // Visit Agent Action Portal
    await page.goto(`http://127.0.0.1:${PORT}/agent/action/mock-agent-action-token`);
    await page.waitForTimeout(2000);
    await expect(page.locator('text=Agent Action Portal')).toBeVisible();

    // Visit Smart Intake Form
    await page.goto(`http://127.0.0.1:${PORT}/request/marketing/mock-intake-token`);
    await page.waitForTimeout(2000);
    await expect(page.locator('text=Smart Intake Portal')).toBeVisible();
  });
});
