import { chromium } from '@playwright/test';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

async function main() {
  const PORT = '3035';
  
  const dbPath = path.join(process.cwd(), 'data', 'db.json');
  if (fs.existsSync(dbPath)) {
    try {
      fs.unlinkSync(dbPath);
    } catch (e) {}
  }

  console.log('Starting test server...');
  const serverProcess = spawn('npx', ['tsx', 'server.ts'], {
    env: {
      ...process.env,
      APP_MODE: 'production',
      STORAGE_DRIVER: 'local',
      DATABASE_URL: 'mongodb://localhost:27017/shapework-test',
      ADMIN_BOOTSTRAP_SECRET: 'test-secret',
      AUTH_PROVIDER_CONFIGURED: 'true',
      CREDENTIAL_ENCRYPTION_KEY: 'mock_encryption_key_32_characters_long!',
      JWT_SECRET: 'mock_jwt_secret_for_e2e_testing_purposes',
      PORT
    }
  });

  serverProcess.stdout?.on('data', (data) => console.log('[Server]', data.toString().trim()));
  serverProcess.stderr?.on('data', (data) => console.error('[Server ERR]', data.toString().trim()));

  await new Promise((resolve) => setTimeout(resolve, 8000));

  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err));

  console.log('Navigating to /app (expecting redirect)...');
  await page.goto(`http://localhost:${PORT}/app`);
  await page.waitForTimeout(2000);
  console.log('URL after redirect:', page.url());

  console.log('Filling credentials...');
  await page.locator('input[type="email"]').fill('sarah.j@nest-demo.local');
  await page.locator('input[type="password"]').fill('password123');
  
  console.log('Submitting...');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(4000);

  console.log('URL after submit:', page.url());
  const html = await page.content();
  console.log('Page HTML snippet:', html.substring(0, 1000));

  await browser.close();
  serverProcess.kill('SIGTERM');
  console.log('Done!');
}

main().catch(err => {
  console.error('Error in script:', err);
  process.exit(1);
});
