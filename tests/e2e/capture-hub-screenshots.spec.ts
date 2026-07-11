import { test } from '@playwright/test';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3890';

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

test('Capture Integrations Hub Screenshots', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto(`http://localhost:${PORT}/app/integrations`);
  await performLogin(page);
  await page.goto(`http://localhost:${PORT}/app/integrations`);
  await page.locator('aside').first().waitFor({ state: 'visible', timeout: 20000 });

  const projectScreenshotDir = '/Users/marcusaman/Downloads/shapework (2)/docs/audit/screenshots';
  const artifactScreenshotDir = '/Users/marcusaman/.gemini/antigravity/brain/0b638d05-d187-4a6a-8c3d-6109272acb07/screenshots';

  for (const dir of [projectScreenshotDir, artifactScreenshotDir]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // 1. Desktop Screenshot (1280 x 800)
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.waitForTimeout(2000); // Allow render
  await page.screenshot({ path: path.join(projectScreenshotDir, 'integrations-desktop-final.png') });
  await page.screenshot({ path: path.join(artifactScreenshotDir, 'integrations-desktop-final.png') });

  // 2. Tablet Screenshot (768 x 1024)
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(2000); // Allow render
  await page.screenshot({ path: path.join(projectScreenshotDir, 'integrations-tablet-final.png') });
  await page.screenshot({ path: path.join(artifactScreenshotDir, 'integrations-tablet-final.png') });

  // 3. Mobile Screenshot (375 x 800)
  await page.setViewportSize({ width: 375, height: 800 });
  await page.waitForTimeout(2000); // Allow render
  await page.screenshot({ path: path.join(projectScreenshotDir, 'integrations-mobile-final.png') });
  await page.screenshot({ path: path.join(artifactScreenshotDir, 'integrations-mobile-final.png') });
});
