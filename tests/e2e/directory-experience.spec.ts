import { test, expect } from '@playwright/test';
import { spawn, execSync } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3069';

test.beforeAll(async () => {
  // Kill only the listening process on this port
  try {
    execSync(`lsof -t -sTCP:LISTEN -i:${PORT} | xargs kill -9`, { stdio: 'ignore' });
  } catch (e) {}

  const dbPath = path.join(process.cwd(), `data-${PORT}`, 'db.json');
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

test.describe('Workspace Directory Experience', () => {
  test.describe.configure({ mode: 'serial' });

  test('Route Test Matrix: Unauthenticated user gets 401 JSON', async ({ request }) => {
    const res = await request.get(`http://localhost:${PORT}/api/directory`);
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('authentication_required');
  });

  test('Route Test Matrix: Invalid API path gets 404 JSON', async ({ request }) => {
    const res = await request.get(`http://localhost:${PORT}/api/directory-does-not-exist`);
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('api_route_not_found');
  });

  test('Route Test Matrix: Authenticated unauthorized user gets 403 JSON', async ({ request }) => {
    const loginRes = await request.post(`http://localhost:${PORT}/api/auth/login`, {
      data: { email: 'diane.ross@nestrealty.com', password: 'password123' }
    });
    expect(loginRes.status()).toBe(200);

    const res = await request.get(`http://localhost:${PORT}/api/directory`);
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('directory_access_denied');
  });

  test('Ryan dynamic overrides & navigation', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    
    // Log in as Ryan (Nest Realty owner)
    await page.goto(`http://localhost:${PORT}/login`);
    await page.locator('input[type="email"]').fill('ryan@nestrealty.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(`**/app/**`);

    await expect(page.locator('text=Loading shapework...')).not.toBeVisible({ timeout: 15000 });

    // Verify sidebar directory rail is visible and enabled
    const navContainer = page.locator('aside').first();
    const directoryButton = navContainer.locator('button[aria-label="Directory"]');
    await expect(directoryButton).toBeVisible();

    // Click to navigate
    await directoryButton.click();
    await page.waitForURL(`**/app/directory`);

    // Verify header
    await expect(page.locator('main h1:has-text("Directory")')).toBeVisible();

    // Ryan has Wilmington workspace overrides, so he SHOULD see + Add Person and Import Directory!
    await expect(page.locator('button:has-text("Import Directory")').first()).toBeVisible();
    await expect(page.locator('button:has-text("+ Add Person")').first()).toBeVisible();

    // Verify seeded contact is displayed
    await expect(page.locator('main').locator('text=Ryan Crecelius').first()).toBeVisible({ timeout: 5000 });
  });

  test('Read-only owner has read-only access', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    
    // Log in as standard Broker Owner (who has read-only directory access)
    await page.goto(`http://localhost:${PORT}/login`);
    await page.locator('input[type="email"]').fill('owner@nestrealty.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(`**/app/**`);

    await expect(page.locator('text=Loading shapework...')).not.toBeVisible({ timeout: 15000 });

    // Click to navigate
    const navContainer = page.locator('aside').first();
    await navContainer.locator('button[aria-label="Directory"]').click();
    await page.waitForURL(`**/app/directory`);

    // Verify seeded contact is displayed
    await expect(page.locator('main').locator('text=Ryan Crecelius').first()).toBeVisible({ timeout: 5000 });

    // Read-only owner should NOT see administrative controls
    await expect(page.locator('button:has-text("Import Directory")')).not.toBeVisible();
    await expect(page.locator('button:has-text("+ Add Person")')).not.toBeVisible();
  });

  test('Admin full management & roster import wizard workflow', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    
    // Log in as Admin
    await page.goto(`http://localhost:${PORT}/login`);
    await page.locator('input[type="email"]').fill('admin@shapework.co');
    await page.locator('input[type="password"]').fill('shapework2026');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(`**/app/**`);

    await expect(page.locator('text=Loading shapework...')).not.toBeVisible({ timeout: 15000 });

    // Navigate to Directory
    const navContainer = page.locator('aside').first();
    await navContainer.locator('button[aria-label="Directory"]').click();
    await page.waitForURL(`**/app/directory`);

    // Admin should see Import Directory and + Add Person buttons
    const importButton = page.locator('button:has-text("Import Directory")').first();
    const addButton = page.locator('button:has-text("+ Add Person")').first();
    await expect(importButton).toBeVisible();
    await expect(addButton).toBeVisible();

    // 1. Manual Add Person Drawer
    await addButton.click();
    await expect(page.locator('h2:has-text("Add Person")')).toBeVisible();
    
    await page.locator('input[placeholder="e.g. Mary Kaye"]').fill('Mary Kaye');
    await page.locator('input[placeholder="e.g. Hester"]').fill('Hester');
    await page.locator('input[placeholder="e.g. Broker"]').fill('BIC - Carolina Beach office');
    await page.locator('input[placeholder="e.g. name@nestrealty.com"]').fill('marykaye@nestrealty.com');
    await page.locator('input[placeholder="e.g. (910) 555-0199"]').fill('910-297-4789');
    
    // Select category as Leadership
    await page.locator('select[name="personType"]').selectOption('leadership');
    // Select Office as Carolina Beach
    await page.locator('select[name="primaryOfficeName"]').selectOption('Carolina Beach');
    // Check Broker-in-Charge
    await page.locator('input[type="checkbox"]').check();

    await page.locator('button:has-text("Create Contact")').click();

    // Verify contact displays in the UI
    await expect(page.locator('text=Mary Kaye Hester')).toBeVisible({ timeout: 5000 });

    // 2. Duplicate Detection Warning Check
    await addButton.click();
    await page.locator('input[placeholder="e.g. Mary Kaye"]').fill('Mary Kaye');
    await page.locator('input[placeholder="e.g. Hester"]').fill('Hester');
    await page.locator('button:has-text("Create Contact")').click();

    // Warning modal should display
    await expect(page.locator('text=Possible existing person found')).toBeVisible();
    // Click Cancel
    await page.locator('button:has-text("Cancel")').nth(1).click();
    // Close Drawer (click the cancel button in the drawer footer)
    await page.locator('button:has-text("Cancel")').first().click();

    // 3. Open Person Drawer
    await page.locator('text=Mary Kaye Hester').click();
    const drawer = page.locator('text=Person Details').first();
    await expect(drawer).toBeVisible();
    
    // Check details inside drawer
    await expect(page.locator('text=marykaye@nestrealty.com').first()).toBeVisible();
    await expect(page.locator('text=910-297-4789').first()).toBeVisible();

    // 4. Edit person details
    await page.locator('button[title="Edit contact details"]').click();
    await expect(page.locator('h2:has-text("Edit Person")')).toBeVisible();
    await page.locator('input[placeholder="e.g. Mary Kaye"]').fill('Mary Kay');
    await page.locator('button:has-text("Save Changes")').click();
    
    // Verify updated name displays
    await expect(page.locator('text=Mary Kay Hester').first()).toBeVisible({ timeout: 5000 });

    // Close the drawer
    await page.locator('button[title="Close drawer"]').click();
    await expect(page.locator('text=Person Details').first()).not.toBeVisible();

    // 5. Import Directory Wizard
    await importButton.click();
    await expect(page.locator('text=Import Directory Wizard')).toBeVisible();

    // Select Google Sheets
    await page.locator('button:has-text("Google Sheets Sync")').click();
    await page.locator('input[type="url"]').fill('https://docs.google.com/spreadsheets/d/1ESWBGGQTz614hT_t1WNLtDHAZz7pApRy');
    await page.locator('button:has-text("Load Columns")').click();

    // Column Mapping step
    await expect(page.locator('text=Map core database attributes')).toBeVisible({ timeout: 10000 });
    await page.locator('button:has-text("Generate Preview")').click();

    // Preview Diffs step
    await expect(page.locator('text=New People to be Added')).toBeVisible({ timeout: 10000 });
    await page.locator('button:has-text("Apply Import changes")').click();

    // Success Outcome step
    await expect(page.locator('text=Roster Sync Complete')).toBeVisible({ timeout: 15000 });
    await page.locator('button:has-text("Close")').click();
    
    // Check that spreadsheet records are populated in UI
    await expect(page.locator('text=Chris Brown').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Eric Knight').first()).toBeVisible();
  });
});
