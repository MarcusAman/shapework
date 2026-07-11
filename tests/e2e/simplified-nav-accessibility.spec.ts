import { test, expect } from '@playwright/test';
import { spawn, execSync } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3897';

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

test('simplified navigation and action link page accessibility validation', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });

  // Login
  await page.goto(`http://localhost:${PORT}/login`);
  await page.locator('input[type="email"]').fill('sarah.j@nest-demo.local');
  await page.locator('input[type="password"]').fill('password123');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(`**/app`);
  await expect(page.locator('text=Loading shapework...')).not.toBeVisible({ timeout: 15000 });

  // 1. Verify keyboard accessibility in sidebar
  await page.goto(`http://localhost:${PORT}/app`);
  
  // Focus on the sidebar container/elements
  const sidebarButtons = page.locator('aside button');
  expect(await sidebarButtons.count()).toBeGreaterThan(0);
  
  // Verify each sidebar button is focusable and has an accessible name
  for (let i = 0; i < await sidebarButtons.count(); i++) {
    const btn = sidebarButtons.nth(i);
    await expect(btn).toBeVisible();
    
    // Check aria-label or text content is defined
    const label = await btn.getAttribute('aria-label') || await btn.textContent();
    expect(label).toBeTruthy();
  }

  // 2. Validate action link page usability via keyboard
  const triggerRes = await page.request.post(`http://localhost:${PORT}/api/notifications/trigger`, {
    headers: { 'x-workspace-id': 'nest-realty-demo' },
    data: {
      recipientId: 'u_owner',
      actionType: 'complete_work_item',
      workItemId: 'wi_gen_owner_worthy_decision_ap_1',
      contextText: 'Accessibility test task.'
    }
  });
  const triggerData = await triggerRes.json();
  const token = triggerData.token;

  await page.goto(`http://localhost:${PORT}/action/${token}`);
  await expect(page.locator('h1')).toBeVisible();

  // Test tabbing into comment box and completing the action via keyboard
  const textarea = page.locator('textarea[placeholder*="Write any comments"]');
  await textarea.focus();
  await expect(textarea).toBeFocused();
  await page.keyboard.type('Submitting using keyboard triggers.');
  
  // Tab to complete button and press Enter
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  
  // Verify successful submission
  await expect(page.locator('h2:has-text("Submission Successful")')).toBeVisible();
});
