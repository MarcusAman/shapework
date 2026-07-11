import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3033';

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
      PORT
    }
  });

  await new Promise((resolve) => setTimeout(resolve, 6000));
});

test.afterAll(async () => {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
});

test('Work Queue: Detail drawer selectors and Staff Management modals', async ({ page }) => {
  // Navigate to Work Queue
  await page.goto(`http://localhost:${PORT}/app/work-queue`);
  const passcode = page.locator('input[type="password"]');
  await passcode.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  if (await passcode.isVisible()) {
    await passcode.fill('shapework2026');
    await page.click('button[type="submit"]');
  }

  await page.locator('aside').first().waitFor({ state: 'visible', timeout: 8000 });

  // Click on "All active" tab to display work items
  await page.click('button:has-text("All active")');

  // Verify Work Queue header
  await expect(page.locator('h3:has-text("Work Queue")')).toBeVisible();

  // Click on the first row to open detail drawer
  await page.locator('tbody tr').first().click();

  // Verify drawer opens and shows custom header without // prefix
  await expect(page.locator('span:has-text("Task Operations Panel")')).toBeVisible();

  // Check that the dropdown for "Change Assigned Owner" is visible
  const assignedSelect = page.locator('select').first();
  await expect(assignedSelect).toBeVisible();

  // Close the drawer using the close button in the header
  await page.locator('.fixed button:has(svg)').first().click();
  await expect(page.locator('span:has-text("Task Operations Panel")')).not.toBeVisible();

  // Go to "People & Ownership" page
  await page.click('aside button:has-text("People & Ownership")');

  // Verify PageHeader has loaded
  await expect(page.locator('h1:has-text("People & Ownership")')).toBeVisible();

  // Verify the sub-tabs exist and can be navigated
  await page.click('button:has-text("Role Ownership Map")');
  await expect(page.locator('span:has-text("Role Ownership & Responsibilities Map")')).toBeVisible();

  await page.click('button:has-text("Escalation Paths")');
  await expect(page.locator('span:has-text("Escalation Hierarchy")')).toBeVisible();

  await page.click('button:has-text("Coverage Gaps")');
  await expect(page.locator('h3:has-text("Brokerage Role Vacancies")')).toBeVisible();

  // Click back to Staff Directory tab
  await page.click('button:has-text("Staff Directory")');
  await expect(page.locator('span:has-text("Active Staff Directory")')).toBeVisible();

  // Verify "Add Staff Member" button is visible and opens modal
  await page.click('button:has-text("Add Staff Member")');
  await expect(page.locator('h3:has-text("Add Staff Member")')).toBeVisible();

  // Fill out the Add Staff Member form
  await page.fill('input[placeholder="e.g. Ann Gunn"]', 'Test Staff Member');
  await page.fill('input[placeholder="e.g. ann@nestrealty.com"]', 'teststaff@nestrealty.com');
  await page.fill('input[placeholder="e.g. 512-555-0100"]', '512-555-9999');
  await page.selectOption('form select', 'marketing_coordinator');
  await page.click('form button[type="submit"]');

  // Verify that the modal closes and the new staff member is listed
  await expect(page.locator('h3:has-text("Add Staff Member")')).not.toBeVisible();
  await expect(page.locator('td:has-text("Test Staff Member")')).toBeVisible();
  await expect(page.locator('td:has-text("512-555-9999")')).toBeVisible();

  // Click on the newly created staff member row to open the edit modal
  await page.locator('tr:has-text("Test Staff Member")').click();
  await expect(page.locator('h3:has-text("Edit Staff Member")')).toBeVisible();

  // Edit their cell phone number
  await page.locator('.fixed form input').nth(2).fill('512-555-8888');
  await page.click('button:has-text("Save Changes")');

  // Verify edit modal closes and phone is updated
  await expect(page.locator('h3:has-text("Edit Staff Member")')).not.toBeVisible();
  await expect(page.locator('td:has-text("512-555-8888")')).toBeVisible();
});
