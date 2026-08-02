import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3082';
const DATABASE_URL = 'postgres://mock:mock@localhost:5432/mock';
const SCREENSHOT_DIR = path.join(process.cwd(), 'screenshots');

async function restartServer() {
  if (serverProcess) {
    serverProcess.kill('SIGKILL');
  }
  // Force kill any remaining process listening on PORT
  try {
    const kp = spawn('sh', ['-c', `lsof -ti :${PORT} | xargs kill -9`]);
    await new Promise((resolve) => kp.on('close', resolve));
    await new Promise((resolve) => setTimeout(resolve, 1000));
  } catch (e) {}

  serverProcess = spawn('npx', ['tsx', 'server.ts'], {
    env: {
      ...process.env,
      APP_MODE: 'development',
      SKIP_DEMO_DELETE: 'true',
      STORAGE_DRIVER: 'database',
      DATABASE_URL,
      DEMO_PASSCODE: 'shapework2026',
      ADMIN_BOOTSTRAP_SECRET: 'test-secret',
      JWT_SECRET: 'mock_jwt_secret_for_e2e_testing_purposes',
      CREDENTIAL_ENCRYPTION_KEY: 'mock_encryption_key_32_characters_long!',
      PASSWORD_RESET_SECRET: 'mock_password_reset_secret_key_32_chars!',
      PORT
    }
  });

  serverProcess.stdout?.on('data', (data) => console.log(`[Postgres Server ${PORT} STDOUT]`, data.toString()));
  serverProcess.stderr?.on('data', (data) => console.error(`[Postgres Server ${PORT} STDERR]`, data.toString()));

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Server on port ${PORT} failed to start within 25 seconds.`));
    }, 25000);

    serverProcess.stdout?.on('data', (data) => {
      if (data.toString().includes('Master full-stack server running')) {
        clearTimeout(timeout);
        resolve();
      }
    });
  });
}

test.beforeAll(async () => {
  // Wipe PostgreSQL database schema before test run
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  await client.query('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;');
  await client.end();
  console.log('[Postgres Gate] Cleaned postgres database successfully.');

  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  await restartServer();
});

test.afterAll(async () => {
  if (serverProcess) {
    serverProcess.kill('SIGKILL');
  }
});

test.describe('PostgreSQL Persistence Gate E2E Checklist', () => {
  test.setTimeout(90000);

  test('Walkthrough full SOP lifecycle using real PostgreSQL persistence', async ({ page }) => {
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', err => console.error('BROWSER ERROR:', err.message));
    page.on('response', async (response) => {
      if (response.status() >= 400) {
        console.log(`API ERROR RESPONSE: ${response.url()} -> ${response.status()}`);
        try {
          console.log(`BODY:`, await response.text());
        } catch {}
      }
    });

    // 1. Login
    await page.goto(`http://localhost:${PORT}/login`);
    await page.fill('input[type="email"]', 'admin@shapework.co');
    await page.fill('input[type="password"]', 'shapework2026');
    await page.click('button:has-text("Log in")');
    await page.waitForURL(`**/app/workboard`);

    // 2. Navigate to SOPs
    await page.goto(`http://localhost:${PORT}/app/sops`);
    await expect(page.locator('h2:has-text("Standard Operating Procedures")').first()).toBeVisible({ timeout: 10000 });

    // 3. Create a blank draft SOP
    await page.click('button:has-text("Create New SOP")');
    await page.click('text=Start Blank Canvas');

    // Stage 1: Purpose & Expected Outcome
    await page.fill('input[placeholder="e.g. Listing Launch Checklist"]', 'Postgres Gate SOP');
    await page.fill('textarea[placeholder="Why does this process exist? What friction does it prevent?"]', 'To verify PostgreSQL persistence.');
    await page.fill('textarea[placeholder="What constitutes a successful final delivery?"]', 'SOP executes correctly.');
    await page.click('button:has-text("Next Step")');

    // Stage 2: Trigger & Scope
    await page.fill('input[placeholder="e.g. Signed listing agreement is uploaded to folder."]', 'Verify Database Connection');
    await page.click('button:has-text("Next Step")');

    // Stage 3: Process Ownership
    await page.selectOption('select:near(label:has-text("Process Owner Position"))', { label: 'Principal Broker (Ryan Crecelius)' });
    await page.selectOption('select:near(label:has-text("Primary Handler Position"))', { label: 'Operations Director (Ann Gunn)' });
    await page.click('button:has-text("Next Step")');

    // Stage 4: Required Info Fields
    await page.click('button:has-text("Next Step")');

    // Stage 5: Process Steps
    await page.click('button:has-text("+ Add Step")');
    await page.fill('input[placeholder="Upload Listing Agreement"]', 'Verify Database Connection');
    await page.fill('textarea[placeholder="Detailed guidelines on how to execute this step..."]', 'Run a query on mock db.');
    await page.click('button:has-text("Save Step")');
    await page.click('button:has-text("Next Step")');

    // Stage 6: Decisions & Exceptions
    await page.click('button:has-text("Next Step")');

    // Stage 7: Escalations Config
    await page.click('button:has-text("Next Step")');

    // Stage 8: Completion Evidence
    await page.fill('input[placeholder="e.g. Verify MLS number is saved and final confirmations email logged."]', 'Checklist completed successfully.');
    await page.click('button:has-text("Next Step")');

    // Stage 9: Governance Schedule
    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/api/ops/sops') && resp.status() === 200),
      page.click('button:has-text("Save Draft")')
    ]);
    await page.waitForTimeout(500);

    // 4. Restart server and reload page
    await restartServer();
    await page.goto(`http://localhost:${PORT}/login`);
    await page.fill('input[type="email"]', 'admin@shapework.co');
    await page.fill('input[type="password"]', 'shapework2026');
    await page.click('button:has-text("Log in")');
    await page.waitForURL(`**/app/workboard`);
    await page.goto(`http://localhost:${PORT}/app/sops`);
    
    // Confirm the draft card loaded correctly from database
    const draftCard = page.locator('div.rounded-3xl').filter({ hasText: 'Postgres Gate SOP' }).filter({ hasText: 'draft v1.0' });
    await expect(draftCard).toBeVisible({ timeout: 15000 });
    await expect(draftCard.locator('span:has-text("draft v1.0")')).toBeVisible();

    // 5. Open draft and Publish Version 1.0
    await draftCard.locator('button:has-text("Edit Draft")').click();
    await expect(page.locator('span:has-text("OPERATING STANDARD")')).toBeVisible({ timeout: 10000 });
    await page.locator('div:has-text("OPERATING STANDARD")').locator('button:has-text("Edit Draft")').click();
    await page.waitForSelector('text=Guided Stepper');
    
    // Go directly to Stage 9
    for (let i = 0; i < 8; i++) {
      await page.click('button:has-text("Next Step")');
    }
    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/api/ops/sops') && resp.status() === 200),
      page.click('button:has-text("Publish v1.0")')
    ]);
    await page.waitForTimeout(500);

    // Verify it is published in the library
    const publishedCard = page.locator('div.rounded-3xl').filter({ hasText: 'Postgres Gate SOP' }).filter({ hasText: 'published v1.0' });
    await expect(publishedCard).toBeVisible({ timeout: 10000 });
    await expect(publishedCard.locator('span:has-text("published v1.0")')).toBeVisible();

    // 6. Start Run
    await publishedCard.locator('button:has-text("Start Run")').click();
    await page.waitForURL(`**/app/sops/runs/*`);

    // Complete step
    await page.click('button:has-text("Complete")');
    await page.waitForTimeout(1000);

    // 7. Submit thumbs down feedback
    await page.click('button[title="Not Helpful"]');
    await page.click('label:has-text("Incorrect information")');
    await page.fill('textarea[placeholder="What should have happened instead?"]', 'Outdated steps.');
    await page.click('button:has-text("Submit Feedback")');
    await page.waitForTimeout(1000);

    // 8. Accept Improvement Request to branch Version 1.1
    await page.goto(`http://localhost:${PORT}/internal/feedback`);
    
    const requestsSection = page.locator('div.rounded-2xl', { has: page.locator('span:has-text("Unresolved Improvement Requests")') });
    const requestRow = requestsSection.locator('div.rounded-xl').filter({ hasText: 'Outdated steps.' }).first();
    await expect(requestRow).toBeVisible({ timeout: 10000 });
    await requestRow.locator('button:has-text("Accept Request")').click();
    await page.waitForTimeout(1500);

    // 9. Go back to Library and verify draft v1.1 exists
    await page.goto(`http://localhost:${PORT}/app/sops`);
    
    // Confirm the draft v1.1 is now in the list (since collapsed, the draft represents the group)
    const newDraftCard = page.locator('div.rounded-3xl').filter({ hasText: 'Postgres Gate SOP' }).filter({ hasText: 'draft v1.1' });
    await expect(newDraftCard).toBeVisible({ timeout: 10000 });
    await expect(newDraftCard.locator('span:has-text("draft v1.1")')).toBeVisible();

    // 10. Open v1.1 draft and publish it
    await newDraftCard.locator('button:has-text("Edit Draft")').click();
    await expect(page.locator('span:has-text("OPERATING STANDARD")')).toBeVisible({ timeout: 10000 });
    await page.locator('div:has-text("OPERATING STANDARD")').locator('button:has-text("Edit Draft")').click();
    await page.waitForSelector('text=Guided Stepper');
    
    for (let i = 0; i < 8; i++) {
      await page.click('button:has-text("Next Step")');
    }
    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/api/ops/sops') && resp.status() === 200),
      page.click('button:has-text("Publish v1.1")')
    ]);
    await page.waitForTimeout(500);

    // Verify it is published in the library as v1.1
    const finalPublishedCard = page.locator('div.rounded-3xl').filter({ hasText: 'Postgres Gate SOP' }).filter({ hasText: 'published v1.1' });
    await expect(finalPublishedCard).toBeVisible({ timeout: 10000 });
    await expect(finalPublishedCard.locator('span:has-text("published v1.1")')).toBeVisible();

    // 11. Final server restart
    await restartServer();
    await page.goto(`http://localhost:${PORT}/login`);
    await page.fill('input[type="email"]', 'admin@shapework.co');
    await page.fill('input[type="password"]', 'shapework2026');
    await page.click('button:has-text("Log in")');
    await page.waitForURL(`**/app/workboard`);
    await page.goto(`http://localhost:${PORT}/app/sops`);

    // Verify template card status v1.1 is still correct
    const reloadCard = page.locator('div.rounded-3xl').filter({ hasText: 'Postgres Gate SOP' }).filter({ hasText: 'published v1.1' });
    await expect(reloadCard).toBeVisible({ timeout: 10000 });
    await expect(reloadCard.locator('span:has-text("published v1.1")')).toBeVisible();

    // Verify the database logs and data are intact
    const client = new Client({ connectionString: DATABASE_URL });
    await client.connect();
    
    // Check SOPs table
    const sopsRes = await client.query("SELECT * FROM ops_sops WHERE sop_id = 'sop_test_auth_123' OR title = 'Postgres Gate SOP' ORDER BY version");
    expect(sopsRes.rows.length).toBeGreaterThan(0);
    // Find version 1.0 record
    const v1 = sopsRes.rows.find(r => r.version === '1.0');
    expect(v1).toBeDefined();
    expect(v1.status).toBe('published');
    // Find version 1.1 record
    const v11 = sopsRes.rows.find(r => r.version === '1.1');
    expect(v11).toBeDefined();
    expect(v11.status).toBe('published');

    // Check Runs table and ensure it remains linked to v1.0
    const runsRes = await client.query("SELECT * FROM ops_sop_runs ORDER BY started_at DESC");
    expect(runsRes.rows.length).toBeGreaterThan(0);
    expect(runsRes.rows[0].sop_version).toBe('1.0'); // Historical run is linked to the version it was started on!

    // Check Feedback table
    const fbRes = await client.query("SELECT * FROM ops_feedback");
    expect(fbRes.rows.length).toBeGreaterThan(0);

    // Check Improvement Requests table
    const irRes = await client.query("SELECT * FROM ops_improvement_requests");
    expect(irRes.rows.length).toBeGreaterThan(0);
    expect(irRes.rows[0].status).toBe('accepted');

    // Check Audit Events table
    const auditRes = await client.query("SELECT * FROM audit_events ORDER BY timestamp DESC");
    expect(auditRes.rows.length).toBeGreaterThan(0);

    await client.end();
    console.log('[Postgres Gate] PostgreSQL database persistence validated successfully!');
  });
});
