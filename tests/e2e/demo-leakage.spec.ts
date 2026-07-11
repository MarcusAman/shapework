import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';

let serverProcess: ChildProcess;
const PORT = '3025';

test.beforeAll(async () => {
  serverProcess = spawn('npx', ['tsx', 'server.ts'], {
    env: {
      ...process.env,
      APP_MODE: 'development',
      STORAGE_DRIVER: 'memory',
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

test('hides demo/sandbox indicators in production mode', async ({ page }) => {
  // Intercept and mock mode response
  await page.route('**/api/mode', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ mode: 'production' })
    });
  });

  await page.goto(`http://localhost:${PORT}/app`);

  const passcode = page.locator('input[type="password"]');
  await passcode.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  if (await passcode.isVisible()) {
    await passcode.fill('shapework2026');
    await page.click('button[type="submit"]');
  }

  // Ensure Exit Demo controls do not leak
  await expect(page.locator('text="Exit Demo"')).not.toBeVisible();
  
  // Ensure Rebranding Notice is hidden
  await expect(page.locator('text="Nest Realty Demo Workspace"')).not.toBeVisible();
});
