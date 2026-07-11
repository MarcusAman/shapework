import { test, expect } from '@playwright/test';
import { spawn, execSync } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3914';

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

test('today needs attention deck: work queue sync and audit logs', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });

  // Login
  await page.goto(`http://localhost:${PORT}/login`);
  await page.locator('input[type="email"]').fill('sarah.j@nest-demo.local');
  await page.locator('input[type="password"]').fill('password123');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(`**/app`);
  await expect(page.locator('text=Loading shapework...')).not.toBeVisible({ timeout: 15000 });

  // Print all initial workItems from dbState API
  const initRes = await page.context().request.get(`http://localhost:${PORT}/api/db-state`, {
    headers: { 'x-workspace-id': 'nest-realty-demo' }
  });
  const initDbState = await initRes.json();
  console.log('INITIAL WORK ITEMS IN DB STATE:', initDbState.workItems.map((w: any) => ({ id: w.id, title: w.title, status: w.status, priority: w.priority })));

  // Wait for the deck to load and the navigation buttons to be visible
  await page.locator('.attention-card-front').first().waitFor({ state: 'visible', timeout: 8000 });
  await page.locator('button[aria-label="Next card"]').first().waitFor({ state: 'visible', timeout: 8000 });

  // Print all card titles in the deck
  const deckCards = page.locator('.attention-card');
  const deckTitles: string[] = [];
  for (let i = 0; i < await deckCards.count(); i++) {
    const t = await deckCards.nth(i).locator('h3').textContent();
    if (t) deckTitles.push(t);
  }
  console.log('ALL DECK CARD TITLES IN TEST:', deckTitles);

  // Find card with title 'Closing file is missing closing date' (which is a Work Item)
  const cards = page.locator('.attention-card-front');
  let cardTitle = await cards.locator('h3').textContent();
  console.log('START CARD TITLE:', cardTitle);
  let steps = 0;
  while (cardTitle !== 'Closing file is missing closing date' && steps < 45) {
    steps++;
    await page.locator('button[aria-label="Next card"]').first().click();
    await page.waitForTimeout(500);
    cardTitle = await cards.locator('h3').textContent();
    console.log(`STEP ${steps} CARD TITLE:`, cardTitle);
  }
  expect(cardTitle).toBe('Closing file is missing closing date');

  // Print front card inner/outer HTML for debugging
  const cardHtml = await cards.evaluate(el => el.outerHTML);
  console.log('FRONT CARD HTML:', cardHtml);

  // Resolve card using specific action button
  await cards.locator('button:has-text("Request missing info")').click();
  await expect(page.locator('text=Marked complete').or(page.locator('text=Approved'))).toBeVisible();

  // 1. Verify it updates in Work Queue (Completed category)
  await page.goto(`http://localhost:${PORT}/app/work-queue`);
  
  // Click on "Completed" tab in Work Queue
  await page.locator('button:has-text("Completed")').first().click();
  await expect(page.locator(`text=${cardTitle}`).first()).toBeVisible();

  // 2. Verify Audit log entry exists
  const stateRes = await page.context().request.get(`http://localhost:${PORT}/api/db-state`, {
    headers: { 'x-workspace-id': 'nest-realty-demo' }
  });
  const dbState = await stateRes.json();
  const auditLogs = dbState.auditEvents || [];
  const actionAudit = auditLogs.find((a: any) => {
    const desc = a.action_description || a.action_details || '';
    return desc.includes(cardTitle) || desc.includes('Action taken');
  });
  expect(actionAudit).toBeDefined();
});
