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
import { google } from 'googleapis';
import { oauthRouter } from './routes/oauthRouter.js';
import { getGoogleRouter } from './integrations/google/googleRoutes.js';
import {
  generateGoogleOAuthState,
  googleActiveStates,
  setGoogleCodeExchangerForTests,
  setGoogleConnectionVerifierForTests,
} from './integrations/google/googleOAuth.js';
import { getAllOAuthCredentials, getAllOAuthTokenRecords, saveOAuthTokenRecord } from './persistence/oauthTokensRepository.js';
import { signJwt } from './auth/jwt.js';
import { csrfProtection } from './auth/csrf.js';

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
    app.use(express.json());
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
    setGoogleCodeExchangerForTests(null);
    setGoogleConnectionVerifierForTests(null);
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
    setGoogleCodeExchangerForTests(async () => ({
      email: 'melissa@nestrealty.com',
      providerAccountId: 'google_melissa',
      encryptedAccessToken: 'enc-access',
      encryptedRefreshToken: 'enc-refresh',
      accessTokenExpiresAt: new Date(Date.now() + 3600_000).toISOString(),
      scopes: ['openid'],
    }));
    setGoogleConnectionVerifierForTests(async () => ({
      verified: true,
      email: 'melissa@nestrealty.com',
      capabilities: { gmail: true, calendar: true, drive: true },
      missingPermissions: [],
    }));
    const state = generateGoogleOAuthState(WORKSPACE, SESSION_USER);
    const res = await fetch(
      `${baseUrl}/api/auth/google/callback?code=exchanged_for_test&state=${state}`,
      { headers: { 'x-session-token': sessionToken() } }
    );
    expect(res.status).toBeLessThan(500);

    const conn = dbState.workspaceIntegrationConnections.find((row) => row.id === `conn_google_${WORKSPACE}`);
    expect(conn).toBeTruthy();
    expect(conn?.workspaceId).toBe(WORKSPACE);
    expect(conn?.provider).toBe('google_workspace');
    expect(conn?.status).toBe('connected');
    expect(conn?.connectedByUserId).toBe(SESSION_USER);
    expect(conn?.connectedByUserId).not.toBe('usr_ryan');
    expect(dbState.workspaceIntegrationConnections.some((row) => String(row.id).startsWith('conn_gw_'))).toBe(false);
    expect(persisted).toContain(WORKSPACE);
    expect(getAllOAuthTokenRecords().some((row) => row.provider === 'google')).toBe(false);
  });

  it('rejects mock_ codes when real credentials are set and does not touch an existing connection', async () => {
    const previousId = process.env.GOOGLE_CLIENT_ID;
    const previousSecret = process.env.GOOGLE_CLIENT_SECRET;
    const previousRedirect = process.env.GOOGLE_REDIRECT_URI;
    const previousMode = process.env.APP_MODE;
    process.env.APP_MODE = 'development';
    process.env.GOOGLE_CLIENT_ID = '1234567890-qa.apps.googleusercontent.com';
    process.env.GOOGLE_CLIENT_SECRET = 'qa-client-secret-not-a-placeholder';
    process.env.GOOGLE_REDIRECT_URI = 'http://localhost:3049/api/auth/google/callback';
    const oauth2 = google.auth.OAuth2.prototype as unknown as { getToken: (code: string) => Promise<unknown> };
    const originalGetToken = oauth2.getToken;
    const originalOauth2 = google.oauth2;
    oauth2.getToken = async () => {
      throw new Error('invalid_grant');
    };
    google.oauth2 = (() => ({ userinfo: { get: async () => { throw new Error('userinfo unavailable'); } } })) as typeof google.oauth2;

    const existing = {
      id: `conn_google_${WORKSPACE}`,
      workspaceId: WORKSPACE,
      provider: 'google_workspace',
      status: 'connected',
      connectedByUserId: 'usr_already',
    };
    dbState.workspaceIntegrationConnections = [existing];
    const before = snapshot();
    try {
      const state = generateGoogleOAuthState(WORKSPACE, SESSION_USER);
      const res = await fetch(
        `${baseUrl}/api/auth/google/callback?code=mock_x&state=${state}`,
        { headers: { 'x-session-token': sessionToken() } }
      );
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
      expect(snapshot()).toEqual(before);
      expect(dbState.workspaceIntegrationConnections).toEqual([existing]);
    } finally {
      oauth2.getToken = originalGetToken;
      google.oauth2 = originalOauth2;
      if (previousId === undefined) delete process.env.GOOGLE_CLIENT_ID;
      else process.env.GOOGLE_CLIENT_ID = previousId;
      if (previousSecret === undefined) delete process.env.GOOGLE_CLIENT_SECRET;
      else process.env.GOOGLE_CLIENT_SECRET = previousSecret;
      if (previousRedirect === undefined) delete process.env.GOOGLE_REDIRECT_URI;
      else process.env.GOOGLE_REDIRECT_URI = previousRedirect;
      if (previousMode === undefined) delete process.env.APP_MODE;
      else process.env.APP_MODE = previousMode;
    }
  });

  it('returns 4xx for an expired state before any connection write', async () => {
    const existing = {
      id: `conn_google_${WORKSPACE}`,
      workspaceId: WORKSPACE,
      provider: 'google_workspace',
      status: 'connected',
      connectedByUserId: 'usr_already',
    };
    dbState.workspaceIntegrationConnections = [existing];
    const before = snapshot();
    const exchanged: string[] = [];
    setGoogleCodeExchangerForTests(async (code) => {
      exchanged.push(code);
      return {
        email: 'melissa@nestrealty.com',
        providerAccountId: 'google_melissa',
        encryptedAccessToken: 'enc-access',
        encryptedRefreshToken: 'enc-refresh',
        accessTokenExpiresAt: new Date(Date.now() + 3600_000).toISOString(),
        scopes: ['openid'],
      };
    });
    setGoogleConnectionVerifierForTests(async () => ({
      verified: true,
      capabilities: { gmail: true, calendar: true, drive: true },
      missingPermissions: [],
    }));
    const state = generateGoogleOAuthState(WORKSPACE, SESSION_USER);
    const stored = googleActiveStates.get(state);
    expect(stored).toBeTruthy();
    stored!.expiresAt = Date.now() - 1000;

    const res = await fetch(
      `${baseUrl}/api/auth/google/callback?code=mock_expired&state=${state}`,
      { headers: { 'x-session-token': sessionToken() } }
    );
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
    expect(exchanged).toEqual([]);
    expect(snapshot()).toEqual(before);
    expect(dbState.workspaceIntegrationConnections).toEqual([existing]);
  });

  it('escapes the OAuth error page and sets a restrictive content security policy', async () => {
    const res = await fetch(
      `${baseUrl}/api/auth/google/callback?error=x&error_description=${encodeURIComponent('<b>y</b>')}`,
      { headers: { 'x-session-token': sessionToken() } }
    );
    const html = await res.text();
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.headers.get('content-security-policy')).toBe("default-src 'none'; style-src 'unsafe-inline'");
    expect(html).toContain('&lt;b&gt;y&lt;/b&gt;');
    expect(html).not.toContain('<b>y</b>');
  });

  it('returns 401 for authorize, credentials, and disconnect without a session and writes nothing', async () => {
    const beforeCreds = JSON.stringify(getAllOAuthCredentials());
    saveOAuthTokenRecord({
      provider: 'google',
      accessToken: 'keep-me',
      status: 'connected',
      updatedAt: new Date().toISOString(),
    });
    const beforeTokens = JSON.stringify(getAllOAuthTokenRecords());

    const authorize = await fetch(`${baseUrl}/api/auth/google/authorize`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });
    const credentials = await fetch(`${baseUrl}/api/auth/credentials`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ provider: 'google', clientId: 'should-not-save', clientSecret: 'secret' }),
    });
    const disconnect = await fetch(`${baseUrl}/api/auth/google/disconnect`, { method: 'POST' });

    expect(authorize.status).toBe(401);
    expect(credentials.status).toBe(401);
    expect(disconnect.status).toBe(401);
    expect(JSON.stringify(getAllOAuthTokenRecords())).toBe(beforeTokens);
    expect(JSON.stringify(getAllOAuthCredentials())).toBe(beforeCreds);
  });
});

describe('CSRF does not trust X-Requested-With alone', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    const app = express();
    app.use(csrfProtection);
    app.post('/api/auth/google/authorize', (_req, res) => {
      res.json({ ok: true });
    });
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
  });

  it('returns 403 when X-Requested-With is set without a CSRF token or matching origin', async () => {
    const res = await fetch(`${baseUrl}/api/auth/google/authorize`, {
      method: 'POST',
      headers: { 'x-requested-with': 'XMLHttpRequest' },
    });
    expect(res.status).toBe(403);
  });
});
