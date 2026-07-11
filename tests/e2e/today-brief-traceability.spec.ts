import { test, expect } from '@playwright/test';
import { spawn, execSync } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3033';

test.beforeAll(async () => {
  try {
    execSync(`lsof -t -sTCP:LISTEN -i:${PORT} | xargs kill -9 2>/dev/null || true`, { stdio: 'ignore' });
  } catch (e) {}

  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'db.json');
  if (fs.existsSync(dbPath)) {
    try {
      fs.unlinkSync(dbPath);
    } catch (e) {}
  }

  serverProcess = spawn('npx', ['tsx', 'server.ts'], {
    env: {
      ...process.env,
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
});

test('Today/Brief Traceability: Telemetry cards click through to sources and Owner Brief is traceable', async ({ page }) => {
  // Login
  await page.goto(`http://localhost:${PORT}/login`);
  await page.locator('input[type="email"]').fill('sarah.j@nest-demo.local');
  await page.locator('input[type="password"]').fill('password123');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(`**/app/workboard`);

  await page.locator('aside').first().waitFor({ state: 'visible', timeout: 8000 });

  // 1. Verify click-through on telemetry metrics card (e.g. Revenue at Risk)
  await page.locator('[data-testid="telemetry-revenue-at-risk"]').click();
  await page.waitForURL(`**/app/work`);
  await expect(page.locator('h1').first()).toContainText('Work Queue');

  // Go back to Workboard tab
  await page.locator('button[aria-label="Workboard"]').click();
  await page.waitForURL(`**/app/workboard`);
  await expect(page.locator('h1').first()).toContainText('Today in the Brokerage');

  // 2. Click on Needs Attention card
  await page.locator('[data-testid="telemetry-needs-attention"]').click();
  await page.waitForURL(`**/app/work`);
  await expect(page.locator('h1').first()).toContainText('Work Queue');

  // 3. Click on Pending Decisions card
  await page.locator('button[aria-label="Workboard"]').click();
  await page.waitForURL(`**/app/workboard`);
  await page.locator('[data-testid="telemetry-pending-decisions"]').click();
  await page.waitForURL(`**/app/approvals`);
  await expect(page.locator('h1').first()).toContainText('Approvals');
});
