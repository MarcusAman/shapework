import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: 'postgres://mock:mock@localhost:5432/mock' });

test.beforeAll(async () => {
  // Clear the database workspaces and users to start clean
  await pool.query('DELETE FROM workspace_memberships');
  await pool.query('DELETE FROM users');
  await pool.query('DELETE FROM workspaces');
});

test.afterAll(async () => {
  await pool.end();
});

test('Production Seeding - Gated behind ADMIN_BOOTSTRAP_SECRET', async () => {
  // --- TEST 1: APP_MODE=production without ADMIN_BOOTSTRAP_SECRET ---
  const portNoSecret = '3015';
  const processNoSecret = spawn('npx', ['tsx', 'server.ts'], {
    env: {
      ...process.env,
      APP_MODE: 'production',
      STORAGE_DRIVER: 'database',
      DATABASE_URL: 'postgres://mock:mock@localhost:5432/mock',
      CREDENTIAL_ENCRYPTION_KEY: 'mock_encryption_key_32_characters_long!',
      AUTH_PROVIDER_CONFIGURED: 'true',
      JWT_SECRET: 'test_jwt_signing_secret_at_least_32_chars_long!',
      PORT: portNoSecret
      // ADMIN_BOOTSTRAP_SECRET is NOT set
    }
  });

  // Wait for server boot
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Query DB - should be completely empty (no default pilot seeds created)
  const workspacesNoSecret = await pool.query("SELECT * FROM workspaces WHERE id = 'nest-realty-demo'");
  const usersNoSecret = await pool.query("SELECT * FROM users WHERE email = 'sarah.j@nest-demo.local'");
  
  expect(workspacesNoSecret.rows.length).toBe(0);
  expect(usersNoSecret.rows.length).toBe(0);

  // Terminate first server process
  processNoSecret.kill('SIGTERM');
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // --- TEST 2: APP_MODE=production WITH ADMIN_BOOTSTRAP_SECRET ---
  const portWithSecret = '3017';
  const processWithSecret = spawn('npx', ['tsx', 'server.ts'], {
    env: {
      ...process.env,
      APP_MODE: 'production',
      STORAGE_DRIVER: 'database',
      DATABASE_URL: 'postgres://mock:mock@localhost:5432/mock',
      CREDENTIAL_ENCRYPTION_KEY: 'mock_encryption_key_32_characters_long!',
      AUTH_PROVIDER_CONFIGURED: 'true',
      JWT_SECRET: 'test_jwt_signing_secret_at_least_32_chars_long!',
      ADMIN_BOOTSTRAP_SECRET: 'bootstrap_secret_2026',
      PORT: portWithSecret
    }
  });

  // Wait for server boot
  await new Promise((resolve) => setTimeout(resolve, 6000));

  // Query DB - should now contain the seeded pilot workspace and owner user
  const workspacesWithSecret = await pool.query("SELECT * FROM workspaces WHERE id = 'nest-realty-demo'");
  const usersWithSecret = await pool.query("SELECT * FROM users WHERE email = 'sarah.j@nest-demo.local'");

  expect(workspacesWithSecret.rows.length).toBe(1);
  expect(usersWithSecret.rows.length).toBe(1);

  // Clean up
  processWithSecret.kill('SIGTERM');
});
