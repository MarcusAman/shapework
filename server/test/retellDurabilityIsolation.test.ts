import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { describe, expect, it, vi } from 'vitest';

const suitePath = new URL('../../src/tests/retellWebhookSignatureAndDurability.test.ts', import.meta.url);
const runtimeUrl = 'postgres://fixture@127.0.0.1:5432/client_runtime';
const disposableUrl = 'postgres://fixture@127.0.0.1:5432/codex_nora_retell_isolation';

/** Execute only suite registration/setup with fake dependencies; no test body, file write, or SQL can run. */
function loadSuite(env: Record<string, string> = {}) {
  const hooks = { beforeAll: [] as Function[], beforeEach: [] as Function[], afterEach: [] as Function[] };
  const factories = new Map<string, Function>();
  const query = vi.fn().mockResolvedValue({ rows: [] });
  const constructed = vi.fn();
  const purge = vi.fn();
  const runtimeQuery = vi.fn(() => { throw new Error('Application pool must never be used.'); });
  const diskWrite = vi.fn(() => { throw new Error('Shared fixture must never be written.'); });
  const fakeFs = { existsSync: () => true, readFileSync: () => 'shared fixture', writeFileSync: diskWrite };
  const describeSuite: any = (_name: string, callback: Function) => callback();
  describeSuite.skipIf = (skip: boolean) => (_name: string, callback: Function) => { if (!skip) callback(); };
  const vitest = {
    describe: describeSuite, it: () => {}, expect,
    beforeAll: (fn: Function) => hooks.beforeAll.push(fn),
    beforeEach: (fn: Function) => hooks.beforeEach.push(fn),
    afterEach: (fn: Function) => hooks.afterEach.push(fn),
    vi: {
      hoisted: (fn: Function) => fn(),
      mock: (id: string, factory: Function) => factories.set(id, factory),
      importActual: async () => ({ default: fakeFs, ...fakeFs }),
      restoreAllMocks: () => {},
    },
  };
  const pg = { Pool: class {
    query = query;
    end = vi.fn().mockResolvedValue(undefined);
    constructor(options: unknown) { constructed(options); }
  } };
  const code = ts.transpileModule(readFileSync(suitePath, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const context = vm.createContext({
    exports: {}, URL, Buffer, console,
    process: { env: { NODE_ENV: 'test', ...env } },
    require: (id: string) => {
      if (id === 'vitest') return vitest;
      if (id === 'pg') return pg;
      if (id.endsWith('/repositories.js')) return { dbPool: { query: runtimeQuery }, getDbPool: () => ({ query: runtimeQuery }) };
      return { purgeAllCanonicalMarketingData: purge, purgeTelephonyCallsInMemory: purge };
    },
  });
  vm.runInContext(code, context, { filename: 'isolated-retell-suite.cjs' });
  return { hooks, factories, query, constructed, purge, runtimeQuery, diskWrite };
}

async function setup(suite: ReturnType<typeof loadSuite>) {
  for (const hook of [...suite.hooks.beforeAll, ...suite.hooks.beforeEach]) await hook();
}

describe('Retell durability suite cannot mutate application storage', () => {
  it('ignores a configured DATABASE_URL without explicit disposable DB opt-in', async () => {
    const suite = loadSuite({ DATABASE_URL: runtimeUrl, ALLOW_PG_POOL_IN_TEST: '1' });
    await setup(suite);
    expect(suite.constructed).not.toHaveBeenCalled();
    expect(suite.query).not.toHaveBeenCalled();
    expect(suite.purge).not.toHaveBeenCalled();
  });

  it.each([
    runtimeUrl,
    'postgres://fixture@remote.invalid:5432/codex_nora_retell_isolation',
    `${disposableUrl}?host=remote.invalid`,
    'https://127.0.0.1/codex_nora_retell_isolation',
  ])('rejects non-disposable or redirected connection target %s before setup', (url) => {
    expect(() => loadSuite({ RETELL_DURABILITY_DATABASE_URL: url, ALLOW_PG_POOL_IN_TEST: '1' })).toThrow(/disposable/i);
  });

  it('requires explicit database opt-in even for the permitted local database name', () => {
    expect(() => loadSuite({ RETELL_DURABILITY_DATABASE_URL: disposableUrl })).toThrow(/opt.in/i);
  });

  it('binds repository getters to its own pool even when application storage was configured', async () => {
    const suite = loadSuite({ DATABASE_URL: runtimeUrl, RETELL_DURABILITY_DATABASE_URL: disposableUrl, ALLOW_PG_POOL_IN_TEST: '1' });
    await setup(suite);
    expect(suite.constructed).toHaveBeenCalledWith(expect.objectContaining({ connectionString: disposableUrl }));
    const repositoryFactory = suite.factories.get('../../server/persistence/repositories.js');
    expect(repositoryFactory).toBeDefined();
    const repositories = await repositoryFactory!();
    expect(repositories.getDbPool().query).toBe(suite.query);
    expect(repositories.dbPool.query).toBe(suite.query);
    expect(suite.runtimeQuery).not.toHaveBeenCalled();
  });

  it('keeps canonical test-store purges in memory instead of writing the shared fixture', async () => {
    const suite = loadSuite();
    const fileFactory = suite.factories.get('fs');
    expect(fileFactory).toBeDefined();
    const fs = (await fileFactory!()).default;
    const fixture = '/checkout/server/data/canonical_marketing_store_test.json';
    fs.writeFileSync(fixture, '{"tasks":[],"requests":[]}');
    expect(fs.readFileSync(fixture, 'utf8')).toBe('{"tasks":[],"requests":[]}');
    expect(suite.diskWrite).not.toHaveBeenCalled();
  });
});
