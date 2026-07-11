import { test, expect } from '@playwright/test';
import { spawn, execSync } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

const PORT = '3953';

test.describe('Dev Email Preview Route Controls', () => {
  let serverProcess: ChildProcess;

  const killRunningServer = () => {
    if (serverProcess) {
      serverProcess.kill('SIGKILL');
    }
    try {
      execSync(`lsof -t -sTCP:LISTEN -i:${PORT} | xargs kill -9`, { stdio: 'ignore' });
    } catch (e) {}
  };

  const cleanDatabase = () => {
    const dbPath = path.join(process.cwd(), 'data', 'db.json');
    if (fs.existsSync(dbPath)) {
      try { fs.unlinkSync(dbPath); } catch (e) {}
    }
  };

  test.afterEach(() => {
    killRunningServer();
  });

  test('dev mode serves preview routes', async ({ page }) => {
    killRunningServer();
    cleanDatabase();

    serverProcess = spawn('npx', ['tsx', 'server.ts'], {
      env: {
        ...process.env,
        STORAGE_DRIVER: 'local',
        ADMIN_BOOTSTRAP_SECRET: 'test-secret',
        AUTH_PROVIDER_CONFIGURED: 'true',
        CREDENTIAL_ENCRYPTION_KEY: 'mock_encryption_key_32_characters_long!',
        JWT_SECRET: 'mock_jwt_secret_for_e2e_testing_purposes',
        DATABASE_URL: 'mongodb://localhost:27017/shapework-test',
        APP_MODE: 'development',
        PORT
      }
    });

    await new Promise((resolve) => setTimeout(resolve, 8000));

    const res = await page.goto(`http://localhost:${PORT}/dev/notifications/email-preview/approval_needed`);
    expect(res?.status()).toBe(200);
    const content = await page.content();
    expect(content).toContain('shapework.');
    expect(content).toContain('Approval Needed');
  });

  test('production mode blocks preview routes with 404', async ({ page }) => {
    killRunningServer();
    cleanDatabase();

    serverProcess = spawn('npx', ['tsx', 'server.ts'], {
      env: {
        ...process.env,
        STORAGE_DRIVER: 'local',
        ADMIN_BOOTSTRAP_SECRET: 'test-secret',
        AUTH_PROVIDER_CONFIGURED: 'true',
        CREDENTIAL_ENCRYPTION_KEY: 'mock_encryption_key_32_characters_long!',
        JWT_SECRET: 'mock_jwt_secret_for_e2e_testing_purposes',
        DATABASE_URL: 'mongodb://localhost:27017/shapework-test',
        APP_MODE: 'production',
        PORT
      }
    });

    await new Promise((resolve) => setTimeout(resolve, 8000));

    page.on('pageerror', () => {});
    const res = await page.goto(`http://localhost:${PORT}/dev/notifications/email-preview/approval_needed`);
    expect(res?.status()).toBe(404);
  });
});
