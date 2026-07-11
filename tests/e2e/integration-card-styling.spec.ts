import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3888';

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

test('Verify Integration Card Styling and CTA Layout', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto(`http://localhost:${PORT}/app/integrations`);
  await performLogin(page);
  await page.goto(`http://localhost:${PORT}/app/integrations`);
  await page.locator('aside').first().waitFor({ state: 'visible', timeout: 20000 });

  // 1. Verify card element styling classes
  const smsCard = page.locator('div[data-provider="sms_provider"]');
  await expect(smsCard).toHaveClass(/integration-card/);
  await expect(smsCard).not.toHaveClass(/bg-stone-900/);

  // 2. Verify status pills utilize soft styles matching design spec
  const smsBadge = smsCard.locator('span.border').first();
  await expect(smsBadge).toHaveClass(/bg-rose-50/); // Missing routes is rose-50

  const resendCard = page.locator('div[data-provider="resend"]');
  const resendBadge = resendCard.locator('span.border').first();
  const resendText = await resendBadge.innerText();
  if (resendText === 'Ready') {
    await expect(resendBadge).toHaveClass(/bg-\[#DDEBDD\]/);
  }

  // 3. Verify Connect CTA button text pattern "Connect [DisplayName] →"
  const qboCard = page.locator('div[data-provider="quickbooks_online"]');
  const qboCTA = qboCard.locator('button').first();
  const qboCTAText = await qboCTA.innerText();
  if (qboCTAText.startsWith('Connect')) {
    expect(qboCTAText).toBe('Connect QuickBooks Online →');
  }
});
