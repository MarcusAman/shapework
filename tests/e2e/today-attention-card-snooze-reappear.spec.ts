import { test, expect } from '@playwright/test';
import { spawn, execSync } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3912';

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

test('today needs attention deck: card snooze and reappearance', async ({ page, context }) => {
  await page.setViewportSize({ width: 1280, height: 800 });

  // Login
  await page.goto(`http://localhost:${PORT}/login`);
  await page.locator('input[type="email"]').fill('sarah.j@nest-demo.local');
  await page.locator('input[type="password"]').fill('password123');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(`**/app`);
  await expect(page.locator('text=Loading shapework...')).not.toBeVisible({ timeout: 15000 });

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER PAGE ERROR:', err.message));

  // Get first card title
  const cards = page.locator('.attention-card-front');
  const cardTitle = await cards.locator('h3').textContent();
  expect(cardTitle).toBeTruthy();

  // Get active card's underlying ID from page state or DB
  const stateRes = await page.context().request.get(`http://localhost:${PORT}/api/db-state`, {
    headers: { 'x-workspace-id': 'nest-realty-demo' }
  });
  console.log('dbState Response Status:', stateRes.status());
  const dbText = await stateRes.text();
  console.log('dbState Response Body:', dbText.slice(0, 300));
  const dbState = JSON.parse(dbText);
  const targetWorkItem = (dbState.workItems || []).find((w: any) => w.title === cardTitle) || (dbState.actionProposals || []).find((p: any) => p.title === cardTitle);
  expect(targetWorkItem).toBeDefined();
  const workItemId = targetWorkItem.id;

  // Click "Not now" (Snooze)
  await cards.locator('button:has-text("Not now")').click();

  // Verify toast appears indicating snooze
  await expect(page.locator('text=Snoozed:')).toBeVisible();

  // Card should disappear from the active deck
  await expect(page.locator('.attention-card-front').locator('h3')).not.toHaveText(cardTitle);

  // Verify snooze state is stored in DB
  const stateRes2 = await page.context().request.get(`http://localhost:${PORT}/api/db-state`, {
    headers: { 'x-workspace-id': 'nest-realty-demo' }
  });
  const dbState2 = await stateRes2.json();
  const snoozeState = dbState2.attentionStates.find((s: any) => s.workItemId === workItemId);
  expect(snoozeState).toBeDefined();
  expect(snoozeState.status).toBe('snoozed');

  // Trigger manual snooze update with a PAST timestamp to simulate cooldown expiry
  const pastTime = new Date(Date.now() - 1000 * 60).toISOString(); // 1 minute ago
  const forceSnoozeRes = await page.context().request.post(`http://localhost:${PORT}/api/attention-states/snooze`, {
    headers: { 
      'x-workspace-id': 'nest-realty-demo',
      'Origin': `http://localhost:${PORT}`,
      'Referer': `http://localhost:${PORT}/`
    },
    data: {
      workItemId,
      priority: targetWorkItem.priority,
      isOverdue: false,
      snoozedUntil: pastTime,
      userName: 'Sarah Jenkins',
      userRole: 'operations_lead'
    }
  });
  console.log('forceSnoozeRes Status:', forceSnoozeRes.status());
  const forceText = await forceSnoozeRes.text();
  console.log('forceSnoozeRes Body:', forceText);
  expect(forceSnoozeRes.ok()).toBe(true);

  // Reload page to re-render deck
  await page.reload();
  await expect(page.locator('text=Loading shapework...')).not.toBeVisible({ timeout: 15000 });

  // Card should reappear at the front or inside the deck since the snooze is expired
  const cardsAfterExpiry = page.locator('.attention-card');
  const titles: string[] = [];
  for (let i = 0; i < await cardsAfterExpiry.count(); i++) {
    const t = await cardsAfterExpiry.nth(i).locator('h3').textContent();
    if (t) titles.push(t);
  }
  expect(titles).toContain(cardTitle);
});
