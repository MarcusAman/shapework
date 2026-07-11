import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';

test('production mode fails closed when DATABASE_URL is missing', async () => {
  const child = spawn('npx', ['tsx', 'server.ts'], {
    env: {
      ...process.env,
      APP_MODE: 'production',
      STORAGE_DRIVER: 'local',
      CREDENTIAL_ENCRYPTION_KEY: 'mock_encryption_key_32_characters_long!',
      DATABASE_URL: '',
      AUTH_PROVIDER_CONFIGURED: 'true'
    }
  });

  let stderrOutput = '';
  child.stderr.on('data', (data) => {
    stderrOutput += data.toString();
  });

  let stdoutOutput = '';
  child.stdout.on('data', (data) => {
    stdoutOutput += data.toString();
  });

  const exitCode = await new Promise((resolve) => {
    child.on('close', resolve);
  });

  expect(exitCode).not.toBe(0);
  const combined = stdoutOutput + stderrOutput;
  expect(combined).toContain('DATABASE_URL is required in production.');
});
