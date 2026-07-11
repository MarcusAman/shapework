import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3881';

test.beforeAll(async () => {
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
      APP_MODE: 'development',
      STORAGE_DRIVER: 'local',
      DEMO_PASSCODE: 'shapework2026',
      ADMIN_BOOTSTRAP_SECRET: 'test-secret',
      JWT_SECRET: 'mock_jwt_secret_for_e2e_testing_purposes',
      PORT
    }
  });

  await new Promise((resolve) => setTimeout(resolve, 8000));
});

test.afterAll(async () => {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
});

async function performLogin(page: any) {
  await page.waitForURL(url => url.pathname.includes('/login'), { timeout: 15000 }).catch(() => {});
  const emailInput = page.locator('input[type="email"]');
  const passcode = page.locator('input[type="password"]');
  await passcode.waitFor({ state: 'visible', timeout: 15000 });
  
  if (await emailInput.isVisible()) {
    await emailInput.fill('owner@nestrealty.com');
    await passcode.fill('password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(800);
    const loginError = page.locator('text=Invalid email or password.');
    if (await loginError.isVisible()) {
      await emailInput.fill('marcus@shapework.co');
      await passcode.fill('shapework2026');
      await page.click('button[type="submit"]');
    }
  } else {
    await passcode.fill('shapework2026');
    await page.click('button[type="submit"]');
  }
}

test('Verify Integration Logos Render Correctly', async ({ page }) => {
  test.setTimeout(60000);
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto(`http://localhost:${PORT}/app/integrations`);
  await performLogin(page);
  await page.goto(`http://localhost:${PORT}/app/integrations`);
  await page.locator('aside').first().waitFor({ state: 'visible', timeout: 20000 });
  await page.waitForTimeout(2000);

  // Print all elements with aria-label to debug
  const elements = await page.locator('[aria-label]').all();
  for (const el of elements) {
    const label = await el.getAttribute('aria-label');
    const tag = await el.evaluate(e => e.tagName);
    console.log(`FOUND ARIA-LABEL [${tag}]:`, label);
  }

  // Assert Rechat Custom Brand Logo
  await expect(page.locator('[aria-label="Rechat Partner Integration Logo"]').first()).toBeVisible();

  // Assert Resend Custom SVG Logo
  await expect(page.locator('svg[aria-label="Resend Email Delivery Logo"]').first()).toBeVisible();

  // Assert Google Workspace Brand Logo
  await expect(page.locator('svg[aria-label="Google Workspace Logo"]').first()).toBeVisible();

  // Assert Dotloop Brand Logo
  await expect(page.locator('svg[aria-label="Dotloop Logo"]').first()).toBeVisible();

  // Assert Plaid Logo
  await expect(page.locator('svg[aria-label="Plaid Bank Feeds Logo"]').first()).toBeVisible();

  // Assert SMTP Custom Email Server Logo
  await expect(page.locator('svg[aria-label="SMTP / Custom Email Server Logo"]').first()).toBeVisible();
});
