/**
 * saveWorkspaceState must not treat an unloaded or unrelated save as a
 * license to delete SQL rows. Login, an empty in-memory list, and a demo
 * reseed are the cases that wiped live integration_connections and audit_events.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express from 'express';
import http from 'http';
import {
  bindPersistOnFinish,
  forgetSqlCollectionLoads,
  loadWorkspaceState,
  saveWorkspaceState,
  seedDatabaseIfEmpty,
} from './dbSync.js';

const WS = 'nest-realty-demo';

type Row = Record<string, unknown>;
type FakeDb = {
  pool: { query: (sql: string, params?: unknown[]) => Promise<{ rows: Row[]; rowCount?: number }> };
  tables: Map<string, Row[]>;
  deletes: Array<{ table: string; ids: string[] }>;
};

function createFakeDb(): FakeDb {
  const tables = new Map<string, Row[]>();
  const deletes: Array<{ table: string; ids: string[] }> = [];
  tables.set(
    'directory_people',
    Array.from({ length: 70 }, (_, i) => ({ id: `dir_${i}`, workspace_id: WS })),
  );
  tables.set('integration_connections', [
    { id: 'conn_live_1', workspace_id: WS, provider: 'google' },
    { id: 'conn_live_2', workspace_id: WS, provider: 'slack' },
  ]);
  tables.set('audit_events', [
    { id: 'audit_live_1', workspace_id: WS, action: 'created' },
    { id: 'audit_live_2', workspace_id: WS, action: 'viewed' },
  ]);
  tables.set('workspace_integration_connections', [
    { id: 'conn_google_ws_wilmington', workspace_id: WS, provider: 'google_drive' },
  ]);

  async function query(sql: string, params: unknown[] = []) {
    const text = sql.replace(/\s+/g, ' ').trim();
    if (/information_schema\.columns/i.test(text)) {
      return { rows: [{ column_name: 'id' }, { column_name: 'workspace_id' }] };
    }
    const del = text.match(/^DELETE FROM (\w+) WHERE id = ANY\(\$1\)$/i);
    if (del) {
      const table = del[1];
      const ids = [...(params[0] as string[])];
      deletes.push({ table, ids });
      const rows = tables.get(table) || [];
      tables.set(table, rows.filter((row) => !ids.includes(String(row.id))));
      return { rows: [], rowCount: ids.length };
    }
    const selId = text.match(/^SELECT id FROM (\w+) WHERE workspace_id = \$1$/i);
    if (selId) {
      const rows = (tables.get(selId[1]) || []).filter((row) => row.workspace_id === params[0]);
      return { rows: rows.map((row) => ({ id: row.id })) };
    }
    const selStar = text.match(/^SELECT \* FROM (\w+) WHERE workspace_id = \$1$/i);
    if (selStar) {
      const rows = (tables.get(selStar[1]) || []).filter((row) => row.workspace_id === params[0]);
      return { rows: rows.map((row) => ({ ...row })) };
    }
    if (/^SELECT \* FROM workspaces WHERE id = \$1/i.test(text)) {
      const rows = (tables.get('workspaces') || []).filter((row) => row.id === params[0]);
      return { rows: rows.map((row) => ({ ...row })) };
    }
    if (/FROM workspaces/i.test(text) && /SELECT 1/i.test(text)) {
      const id = (params[0] as string) || 'nest-realty-demo';
      const rows = (tables.get('workspaces') || []).filter((row) => row.id === id);
      return { rows: rows.length ? [{ '?column?': 1 }] : [] };
    }
    return { rows: [] };
  }

  return { pool: { query }, tables, deletes };
}

function idsOf(db: FakeDb, table: string): string[] {
  return (db.tables.get(table) || []).map((row) => String(row.id)).sort();
}

function seedMemory() {
  return {
    integrations: [
      { id: 'seed_conn_a', workspaceId: WS, provider: 'seed' },
      { id: 'seed_conn_b', workspaceId: WS, provider: 'seed' },
    ],
    auditEvents: [
      { id: 'seed_audit_a', workspaceId: WS, action: 'seed' },
      { id: 'seed_audit_b', workspaceId: WS, action: 'seed' },
    ],
    workspaceIntegrationConnections: [
      { id: 'seed_google', workspaceId: WS, provider: 'google_drive' },
    ],
  };
}

function expectLiveRows(db: FakeDb) {
  expect(idsOf(db, 'integration_connections')).toEqual(['conn_live_1', 'conn_live_2']);
  expect(idsOf(db, 'audit_events')).toEqual(['audit_live_1', 'audit_live_2']);
  expect(idsOf(db, 'workspace_integration_connections')).toEqual(['conn_google_ws_wilmington']);
  const wiped = db.deletes.filter((entry) =>
    ['integration_connections', 'audit_events', 'workspace_integration_connections'].includes(entry.table),
  );
  expect(wiped).toEqual([]);
}

type Memory = Record<string, unknown>;

function createPersistApp(db: FakeDb, getMemory: () => Memory, onLogin?: (memory: Memory) => void) {
  const app = express();
  app.use(express.json());
  const holder: { done: Promise<void> } = { done: Promise.resolve() };
  app.use((req, res, next) => {
    let resolveDone: () => void = () => {};
    holder.done = new Promise<void>((resolve) => {
      resolveDone = resolve;
    });
    bindPersistOnFinish(req, res, WS, getMemory, async (workspaceId, options) => {
      try {
        await saveWorkspaceState(db.pool as never, workspaceId, getMemory(), options);
      } finally {
        resolveDone();
      }
    });
    next();
  });
  app.post('/api/auth/login', (_req, res) => {
    onLogin?.(getMemory());
    res.status(401).json({ error: 'Unauthorized' });
  });
  app.post('/api/tasks/touch', async (_req, res) => {
    await saveWorkspaceState(db.pool as never, WS, getMemory());
    res.status(200).json({ ok: true });
  });
  app.post('/api/notes', (_req, res) => {
    res.status(200).json({ ok: true });
  });
  return { app, holder };
}

async function post(app: express.Express, path: string, holder: { done: Promise<void> }) {
  const server = http.createServer(app);
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('expected a TCP port');
  try {
    const response = await fetch(`http://127.0.0.1:${address.port}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });
    await response.text();
    await holder.done;
  } finally {
    await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
}

describe('saveWorkspaceState delete reconcile', () => {
  beforeEach(() => {
    forgetSqlCollectionLoads();
  });

  afterEach(() => {
    forgetSqlCollectionLoads();
  });

  it('(a) login does not delete SQL rows when memory is only the seed or empty', async () => {
    const db = createFakeDb();
    let memory: Memory = seedMemory();
    const seeded = createPersistApp(db, () => memory);
    await post(seeded.app, '/api/auth/login', seeded.holder);
    expectLiveRows(db);

    const emptyDb = createFakeDb();
    const empty = createPersistApp(emptyDb, () => ({
      integrations: [],
      auditEvents: [],
      workspaceIntegrationConnections: [],
    }));
    await post(empty.app, '/api/auth/login', empty.holder);
    expectLiveRows(emptyDb);

    const staleDb = createFakeDb();
    await loadWorkspaceState(staleDb.pool as never, WS);
    memory = seedMemory();
    const stale = createPersistApp(staleDb, () => memory, (state) => {
      const integrations = state.integrations as Array<{ id: string }>;
      state.integrations = integrations.slice(0, 1);
    });
    await post(stale.app, '/api/auth/login', stale.holder);
    expectLiveRows(staleDb);
  });

  it('(b) a real delete of a loaded row still removes it', async () => {
    const db = createFakeDb();
    const state = await loadWorkspaceState(db.pool as never, WS);
    state.integrations = state.integrations.filter((item: { id: string }) => item.id !== 'conn_live_2');
    expect(state.integrations.map((item: { id: string }) => item.id)).toEqual(['conn_live_1']);

    await saveWorkspaceState(db.pool as never, WS, state);

    expect(idsOf(db, 'integration_connections')).toEqual(['conn_live_1']);
    expect(idsOf(db, 'audit_events')).toEqual(['audit_live_1', 'audit_live_2']);
    expect(idsOf(db, 'workspace_integration_connections')).toEqual(['conn_google_ws_wilmington']);
    expect(db.deletes).toEqual([{ table: 'integration_connections', ids: ['conn_live_2'] }]);
  });

  it('(c) after a demo reseed the next POST does not delete SQL rows', async () => {
    const db = createFakeDb();
    await loadWorkspaceState(db.pool as never, WS);
    const memory = seedMemory();

    const previousMode = process.env.APP_MODE;
    process.env.APP_MODE = 'development';
    try {
      await seedDatabaseIfEmpty(db.pool as never, memory);
    } finally {
      if (previousMode === undefined) delete process.env.APP_MODE;
      else process.env.APP_MODE = previousMode;
    }
    expectLiveRows(db);

    const app = createPersistApp(db, () => memory);
    await post(app.app, '/api/tasks/touch', app.holder);
    expectLiveRows(db);
  });

  it('does not delete a loaded collection whose in-memory list is empty', async () => {
    const db = createFakeDb();
    const state = await loadWorkspaceState(db.pool as never, WS);
    state.integrations = [];
    state.auditEvents = [];
    state.workspaceIntegrationConnections = [];

    await saveWorkspaceState(db.pool as never, WS, state);

    expectLiveRows(db);
  });

  it('a POST that does not change a loaded collection does not delete its rows', async () => {
    const db = createFakeDb();
    await loadWorkspaceState(db.pool as never, WS);
    const memory = seedMemory();
    const app = createPersistApp(db, () => memory);
    await post(app.app, '/api/notes', app.holder);
    expectLiveRows(db);
  });
});
