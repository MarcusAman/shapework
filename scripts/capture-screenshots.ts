import { chromium, expect } from '@playwright/test';
import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const PORT = '3199';
const REPO_SCREENSHOTS_DIR = path.join(process.cwd(), 'screenshots');
const ARTIFACTS_SCREENSHOTS_DIR = '/Users/marcusaman/.gemini/antigravity/brain/0b638d05-d187-4a6a-8c3d-6109272acb07/screenshots';

// Ensure output directories exist
fs.mkdirSync(REPO_SCREENSHOTS_DIR, { recursive: true });
fs.mkdirSync(ARTIFACTS_SCREENSHOTS_DIR, { recursive: true });

async function run() {
  console.log('Clearing old test database...');
  try {
    execSync(`lsof -t -sTCP:LISTEN -i:${PORT} | xargs kill -9`, { stdio: 'ignore' });
  } catch (e) {}
  
  const dbPath = path.join(process.cwd(), 'data', 'db.json');
  if (fs.existsSync(dbPath)) {
    try { fs.unlinkSync(dbPath); } catch (e) {}
  }

  console.log('Starting app server on port', PORT);
  const serverProcess = spawn('npx', ['tsx', 'server.ts'], {
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

  // Wait for server to boot
  await new Promise((resolve) => setTimeout(resolve, 8000));

  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  try {
    // 1. Log in
    const page = await context.newPage();
    console.log('Logging in...');
    await page.goto(`http://localhost:${PORT}/login`);
    await page.locator('input[type="email"]').fill('sarah.j@nest-demo.local');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(`**/app`);
    await page.locator('text=Loading shapework...').waitFor({ state: 'detached', timeout: 15000 });
    await page.locator('.attention-card-front').first().waitFor({ state: 'visible', timeout: 8000 });
    console.log('Login successful.');

    // Screenshot helper
    const capture = async (name: string, width: number, height: number, customActions?: () => Promise<void>) => {
      console.log(`Capturing ${name} (${width}x${height})...`);
      await page.setViewportSize({ width, height });
      await page.waitForTimeout(1000); // Wait for transition/styling stability
      if (customActions) {
        await customActions();
      }
      const repoPath = path.join(REPO_SCREENSHOTS_DIR, name);
      const artifactPath = path.join(ARTIFACTS_SCREENSHOTS_DIR, name);
      
      await page.screenshot({ path: repoPath, fullPage: false });
      fs.copyFileSync(repoPath, artifactPath);
      console.log(`Saved ${name} to repo and artifacts.`);
    };

    // 2. today-action-deck-desktop.png (1280x800)
    await capture('today-action-deck-desktop.png', 1280, 800);

    // 3. today-action-deck-mobile.png (375x812)
    await capture('today-action-deck-mobile.png', 375, 812);

    // 4. action-card-empty-state.png (1280x800) - Select the Completed tab which has 0 items
    await capture('action-card-empty-state.png', 1280, 800, async () => {
      await page.locator('button:has-text("Completed")').first().click();
      await page.waitForTimeout(500);
      await expect(page.locator('text=No recently completed items.')).toBeVisible();
    });

    // Reset tab to attention for secure action tests
    await page.locator('button:has-text("Needs attention")').first().click();

    // 5. Navigate to secure action link: /action/ap_1
    // First, let's clear authentication state by clearing context cookies/storage
    console.log('Navigating to secure action link...');
    const securePage = await context.newPage();
    await securePage.goto(`http://localhost:${PORT}/action/ap_1`);
    await securePage.waitForTimeout(1000);

    // Helper for secure link screenshots
    const captureSecure = async (name: string, width: number, height: number) => {
      console.log(`Capturing ${name} (${width}x${height})...`);
      await securePage.setViewportSize({ width, height });
      await securePage.waitForTimeout(1000);
      const repoPath = path.join(REPO_SCREENSHOTS_DIR, name);
      const artifactPath = path.join(ARTIFACTS_SCREENSHOTS_DIR, name);
      await securePage.screenshot({ path: repoPath, fullPage: false });
      fs.copyFileSync(repoPath, artifactPath);
      console.log(`Saved ${name} to repo and artifacts.`);
    };

    // 6. action-link-page-desktop.png (1280x800)
    await captureSecure('action-link-page-desktop.png', 1280, 800);

    // 7. action-link-page-mobile.png (375x812)
    await captureSecure('action-link-page-mobile.png', 375, 812);

    console.log('All screenshots captured successfully!');
  } catch (err) {
    console.error('Error during screenshot capture:', err);
  } finally {
    await browser.close();
    serverProcess.kill('SIGKILL');
    console.log('Browser closed and server process terminated.');
  }
}

run();
