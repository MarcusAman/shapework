import { afterAll, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));
const scratch = mkdtempSync(path.join(tmpdir(), 'nora-packaging-fixture-'));
const fixture = path.join(scratch, 'source');
mkdirSync(fixture);
const sdkEnv = {
  ...process.env,
  CLOUDSDK_CONFIG: path.join(scratch, 'gcloud-config'),
  CLOUDSDK_CORE_DISABLE_USAGE_REPORTING: 'true',
  CLOUDSDK_COMPONENT_MANAGER_DISABLE_UPDATE_CHECK: 'true',
  CLOUDSDK_CORE_DISABLE_PROMPTS: 'true',
};
const gcloudAvailable = spawnSync('gcloud', ['--version'], { env: sdkEnv, timeout: 15000, stdio: 'ignore' }).status === 0;

const excluded = [
  '.env', '.env.local', '.env.production', 'nested/.env', 'nested/.env.uat',
  'oauth_credentials.json', 'data/oauth_credentials.json', 'nested/oauth_credentials.backup.json',
  'oauth_tokens.json', 'data/oauth_tokens.json', 'nested/oauth_tokens.copy.json',
  'tokens.json', 'nested/tokens.json', 'reset_tokens.json', 'data/reset_tokens.json', 'nested/reset_tokens.backup.json',
  'qa-artifacts/screenshots/browser.png', 'qa-evidence/run/copy.json',
  'tmp/session/export.json', 'var/folders/session/export.json', 'data/pg_data/base/1/1234',
];
const retained = [
  '.env.example', 'nested/.env.example', 'package.json', 'package-lock.json', 'Dockerfile',
  'server.ts', 'src/main.tsx', 'src/index.css', 'src/dataconnect-generated/package.json',
  'public/nora-email-logo.png', 'public/logo.svg',
  'server/data/canonical_marketing_store.json', 'data/workspace_seed.json',
];
for (const name of [...excluded, ...retained]) {
  const file = path.join(fixture, name);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, 'synthetic packaging fixture only\n');
}
afterAll(() => rmSync(scratch, { recursive: true, force: true }));

describe('Deployment packaging excludes local secrets while retaining build inputs', () => {
  it.skipIf(!gcloudAvailable)('gcloud dry-run excludes fake secrets and includes application source, seed files, and email logo', () => {
    writeFileSync(path.join(fixture, '.gcloudignore'), readFileSync(path.join(root, '.gcloudignore')));
    const result = spawnSync('gcloud', ['meta', 'list-files-for-upload'], {
      cwd: fixture, env: sdkEnv, encoding: 'utf8', timeout: 20000,
    });
    expect(result.status, result.stderr).toBe(0);
    const upload = new Set(result.stdout.split(/\r?\n/).map(line => line.trim().replace(/^\.\//, '')).filter(Boolean));
    expect(excluded.filter(file => upload.has(file))).toEqual([]);
    expect(retained.filter(file => !upload.has(file))).toEqual([]);
  });

  it('uses the same explicit root/nested secret and scratch-directory rules for Docker COPY', () => {
    const requiredPatterns = [
      '.env*', '**/.env*', '!.env.example', '!**/.env.example',
      'oauth_credentials*.json', '**/oauth_credentials*.json',
      'oauth_tokens*.json', '**/oauth_tokens*.json',
      'tokens.json', '**/tokens.json', 'reset_tokens*.json', '**/reset_tokens*.json',
      'qa-artifacts/', 'qa-evidence/', 'tmp/', 'var/', 'data/pg_data/',
    ];
    for (const file of ['.gcloudignore', '.dockerignore']) {
      const lines = readFileSync(path.join(root, file), 'utf8').split(/\r?\n/).map(line => line.trim());
      expect(requiredPatterns.filter(pattern => !lines.includes(pattern)), file).toEqual([]);
      expect(lines.indexOf('!.env.example')).toBeGreaterThan(lines.indexOf('.env*'));
      expect(lines.indexOf('!**/.env.example')).toBeGreaterThan(lines.indexOf('**/.env*'));
      // Runtime seed files and branding remain in the build context.
      for (const broad of ['data', 'data/', 'server/data', 'server/data/', 'src', 'src/', 'public', 'public/']) {
        expect(lines, `${file} must retain build/runtime inputs`).not.toContain(broad);
      }
    }
  });
});
