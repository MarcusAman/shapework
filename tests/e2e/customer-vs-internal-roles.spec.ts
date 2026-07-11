import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';

let serverProcess: ChildProcess;
const PORT = '3142';

test.beforeAll(async () => {
  serverProcess = spawn('npx', ['tsx', 'server.ts'], {
    env: {
      ...process.env,
      APP_MODE: 'development',
      STORAGE_DRIVER: 'memory',
      PORT
    }
  });

  serverProcess.stdout?.on('data', (data) => console.log(`[Server ${PORT} STDOUT]`, data.toString()));
  serverProcess.stderr?.on('data', (data) => console.error(`[Server ${PORT} STDERR]`, data.toString()));

  await new Promise((resolve) => setTimeout(resolve, 12000));
});

test.afterAll(async () => {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
});

test('Customer vs Internal Roles - Directory isolation and role assignment controls', async ({ page }) => {
  // Navigate to People page
  await page.goto(`http://localhost:${PORT}/app/people`);
  
  const passcode = page.locator('input[type="password"]');
  await passcode.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  if (await passcode.isVisible()) {
    await passcode.fill('shapework2026');
    await page.click('button[type="submit"]');
  }

  await page.locator('aside').first().waitFor({ state: 'visible', timeout: 8000 });

  // 1. Verify Active Staff Directory is visible
  await expect(page.locator('span:has-text("Active Staff Directory")')).toBeVisible();

  // 2. Verify Alex Operator (shapework_operator role) is NOT in the list
  await expect(page.locator('td:has-text("Alex Operator")')).not.toBeVisible();

  // 3. Open Add Staff Member modal and verify no shapework internal roles exist in the dropdown
  await page.click('button:has-text("Add Staff Member")');
  await expect(page.locator('h3:has-text("Add Staff Member")')).toBeVisible();

  const selectOptions = await page.locator('form select').innerText();
  expect(selectOptions).not.toContain('shapework_operator');
  expect(selectOptions).not.toContain('developer');
  expect(selectOptions).not.toContain('shapework_admin');

  // Verify it contains customer roles
  expect(selectOptions).toContain('Agent');
  expect(selectOptions).toContain('Operations Lead');
});
