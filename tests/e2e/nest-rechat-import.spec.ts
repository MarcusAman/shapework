import { test, expect } from '@playwright/test';
import { spawn, execSync } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3071';

test.beforeAll(async () => {
  // Kill any listening process on this port
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
      APP_MODE: 'development',
      STORAGE_DRIVER: 'local',
      ADMIN_BOOTSTRAP_SECRET: 'test-secret',
      PORT
    }
  });

  await new Promise((resolve) => setTimeout(resolve, 8000));
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

test.describe('Nest Rechat Roster Importer & Needs Review Management', () => {
  test.describe.configure({ mode: 'serial' });

  test('Ryan logs in, uploads headerless Nest roster, completes import, resolves Needs Review', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // 1. Log in
    await page.goto(`http://localhost:${PORT}/login`);
    await page.locator('input[type="email"]').fill('ryan@nestrealty.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(`**/app/**`);

    await expect(page.locator('text=Loading shapework...')).not.toBeVisible({ timeout: 15000 });

    // 2. Navigate to Directory
    const navContainer = page.locator('aside').first();
    await navContainer.locator('button[aria-label="Directory"]').click();
    await page.waitForURL(`**/app/directory`);

    // 3. Open Import Wizard
    await page.locator('button:has-text("Import Directory")').first().click();
    await expect(page.locator('text=Import Directory Wizard')).toBeVisible();

    // Select Pasted Text Option
    await page.locator('button:has-text("Paste Roster Rows")').click();
    await expect(page.locator('text=Paste Delimited Roster Rows')).toBeVisible();

    // 4. Paste headerless Nest roster data
    const rosterData = [
      'In Rechat\t01/01/2026\tmary_acct\t111\t9105551234\tMary Hester\tmary@nestrealty.com\tBroker-in-Charge\tMayfaire\t123 main st\tapt 1\t01/01/2026\tmary.alt@gmail.com\tThe Hester Team (Leader)',
      'X\t01/02/2026\tjohn_acct\t222\t(910) 555-4321\tJohn Doe\tjohn@nestrealty.com\tAgent\tMayfaire\t456 oak rd\t\t01/02/2026\tjohn.alt@gmail.com\t',
      'In Rechat\t01/03/2026\tjane_acct\t333\t910-555-9999\tJane Smith\tjane@nestrealty.com\tAgent\tMayfaire\t789 pine ln\t\t01/03/2026\t\tThe Hester Team',
      'In Rechat\t01/04/2026\tbob_acct\t444\t\tBob Missing\t\tAgent\tMayfaire\t\t\t01/04/2026\t\t'
    ].join('\n');

    await page.locator('textarea[placeholder*="First Name"]').fill(rosterData);

    // 5. Assert warning banner is visible
    await expect(page.locator('text=Nest Realty Roster Signature Detected')).toBeVisible();

    // 6. Click "Use Positional Nest Roster Import"
    await page.locator('button:has-text("Use Positional Nest Roster Import")').click();

    // 7. Verify we skipped step 3 and landed on step 4 (Preview)
    await expect(page.locator('text=Found Rows')).toBeVisible({ timeout: 10000 });

    // Check we see expected additions
    await expect(page.locator('table >> text=Mary Hester')).toBeVisible();
    await expect(page.locator('table >> text=john@nestrealty.com')).toBeVisible();

    // 8. Apply Import
    await page.locator('button:has-text("Apply Import changes")').click();
    await expect(page.locator('text=Roster Sync Complete')).toBeVisible({ timeout: 5000 });

    // Verify added count (4 records processed: 3 active or needs_review, 1 inactive/skipped/etc.)
    await expect(page.locator('text=New People Added')).toBeVisible();

    // Close wizard
    await page.locator('button:has-text("Close")').click();
    await expect(page.locator('text=Import Directory Wizard')).not.toBeVisible();

    // 9. Verify Directory Listing contains imported agents
    await expect(page.locator('text=Mary Hester').first()).toBeVisible({ timeout: 8000 });

    // 10. Filter by "Needs Review" tab
    await page.locator('button[id="status-tab-needs_review"]').click();

    // "John Doe" (marked X), "Bob Missing" (no email/phone), and "Jane Smith" (unclassified role) should show up in review list!
    await expect(page.locator('text=John Doe').first()).toBeVisible();
    await expect(page.locator('text=Bob Missing').first()).toBeVisible();
    await expect(page.locator('text=Jane Smith').first()).toBeVisible();

    // Open detail drawer for John Doe
    await page.locator('text=John Doe').first().click();
    await expect(page.locator('h5:has-text("Administrative Action Needed")')).toBeVisible();
    await expect(page.locator('text=Marked with \'X\' in source roster')).toBeVisible();

    // Click "Approve as Active"
    await page.locator('button[id="btn-approve-active"]').click();

    // Toast notification should pop up
    await expect(page.locator('text=Contact approved as active!')).toBeVisible();

    // Close drawer
    await page.locator('button[aria-label="Close drawer"]').click();

    // John Doe should no longer be in "Needs Review" list
    await expect(page.locator('text=John Doe').first()).not.toBeVisible();
  });
});
