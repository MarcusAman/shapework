/** Local capture-only gallery. The test suite replaces all outbound transports. */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destination = process.argv[2];
if (!destination || !path.isAbsolute(destination)) throw new Error('Provide an absolute output directory for the local HTML gallery.');
const result = spawnSync(process.execPath, [path.join(root, 'node_modules/vitest/vitest.mjs'), 'run', 'server/email/noraEmailDesign.test.ts', '--fileParallelism=false'], {
  cwd: root, stdio: 'inherit', env: { ...process.env, NODE_ENV: 'test', NORA_EMAIL_PREVIEW_DIR: destination },
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
