/**
 * The Workspace connect redirect lands on GET /api/auth/google/callback.
 * That legacy handler must not mint a connected Google record. It has to run
 * the same session, state, and workspace_integration_connections callback as
 * GET /api/integrations/google/callback.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import express from 'express';
import fs from 'fs';
import os from 'os';
import path from 'path';
import type { Server } from 'http';
import { oauthRouter } from './routes/oauthRouter.js';
import { getGoogleRouter } from './integrations/google/googleRoutes.js';
import { generateGoogleOAuthState } from './integrations/google/googleOAuth.js';
import { getAllOAuthTokenRecords } from './persistence/oauthTokensRepository.js';
import { signJwt } from './auth/jwt.js';

const SESSION_USER = 'usr_melissa';
const WORKSPACE = 'ws_wilmington';

describe('GET /api/auth/google/callback uses the integrations callback', () => {
  let server: Server;
  let baseUrl: string;
  let tenantDir: string;
  let previousTenant: string | undefined;
  const persisted: string[] = [];
  const dbState: {
    workspaceIntegrationConnections: Array<Record<string, unknown>>;
    saveStateToStorage: (wsId?: string) => Promise<void>;
  } = {
    workspaceIntegrationConnections: [],
    saveStateToStorage: async (wsId?: string) => {
      persisted.push(wsId || '');
    },
  };

  beforeAll(async () => {
    previousTenant = process.env.ACTIVE_TENANT_DIR;
    tenantDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oauth-callback-'));
    process.env.ACTIVE_TENANT_DIR = tenantDir;
    (global as { __SHAPEWORK_DB_STATE?: unknown }).__SHAPEWORK_DB_STATE = dbState;

    const app = express();
    app.use('/api/integrations/google', getGoogleRouter(dbState, dbState.saveStateToStorage));
    app.use('/api/auth', oauthRouter);
    app.use('/api/integrations', oauthRouter);
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address() as { port: number };
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
    delete (global as { __SHAPEWORK_DB_STATE?: unknown }).__SHAPEWORK_DB_STATE;
    if (previousTenant === undefined) delete process.env.ACTIVE_TENANT_DIR;
    else process.env.ACTIVE_TENANT_DIR = previousTenant;
    fs.rmSync(tenantDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    dbState.workspaceIntegrationConnections = [];
    persisted.length = 0;
  });

  function sessionToken(): string {
    return signJwt({
      userId: SESSION_USER,
      email: 'melissa@nestrealty.com',
      name: 'Melissa Gagliardi',
      role: 'marketing_director',
      workspaceId: WORKSPACE,
    });
  }

  function snapshot() {
    return {
      tokens: JSON.stringify(getAllOAuthTokenRecords()),
      connections: JSON.stringify(dbState.workspaceIntegrationConnections),
      persisted: persisted.slice(),
    };
  }

  it('returns 4xx for a bare GET and writes no oauth token or connection', async () => {
    const before = snapshot();
    const res = await fetch(`${baseUrl}/api/auth/google/callback`);
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
    expect(snapshot()).toEqual({ ...before, persisted: before.persisted });

    const authed = await fetch(`${baseUrl}/api/auth/google/callback`, {
      headers: { 'x-session-token': sessionToken() },
    });
    expect(authed.status).toBeGreaterThanOrEqual(400);
    expect(authed.status).toBeLessThan(500);
    expect(snapshot()).toEqual({ ...before, persisted: before.persisted });
    expect(getAllOAuthTokenRecords().some((row) => row.provider === 'google' && row.status === 'connected')).toBe(false);
  });

  it('returns 4xx for a bad state and writes nothing', async () => {
    const before = snapshot();
    const res = await fetch(
      `${baseUrl}/api/auth/google/callback?code=mock_rejected_code&state=not-a-real-state`,
      { headers: { 'x-session-token': sessionToken() } }
    );
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
    expect(snapshot()).toEqual({ ...before, persisted: before.persisted });
    expect(dbState.workspaceIntegrationConnections).toEqual([]);
    expect(getAllOAuthTokenRecords().some((row) => row.provider === 'google')).toBe(false);
  });

  it('writes conn_google_ws_wilmington for the session user on a valid state', async () => {
    const state = generateGoogleOAuthState(WORKSPACE, SESSION_USER);
    const res = await fetch(
      `${baseUrl}/api/auth/google/callback?code=mock_workspace_connect&state=${state}`,
      { headers: { 'x-session-token': sessionToken() } }
    );
    expect(res.status).toBeLessThan(500);

    const conn = dbState.workspaceIntegrationConnections.find((row) => row.id === `conn_google_${WORKSPACE}`);
    expect(conn).toBeTruthy();
    expect(conn?.workspaceId).toBe(WORKSPACE);
    expect(conn?.provider).toBe('google_workspace');
    expect(conn?.connectedByUserId).toBe(SESSION_USER);
    expect(conn?.connectedByUserId).not.toBe('usr_ryan');
    expect(dbState.workspaceIntegrationConnections.some((row) => String(row.id).startsWith('conn_gw_'))).toBe(false);
    expect(persisted).toContain(WORKSPACE);
    expect(getAllOAuthTokenRecords().some((row) => row.provider === 'google')).toBe(false);
  });
});
