/**
 * Every route mounted by getGoogleRouter must require a session and
 * manage_integrations. OAuth callback paths keep their existing state checks.
 * Unauthenticated requests must not reach sendEmail or Gmail/Drive clients.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import express from 'express';
import type { Server } from 'http';
import type { Router } from 'express';
import { google } from 'googleapis';
import { getGoogleRouter } from './googleRoutes.js';
import { oauthRouter } from '../../routes/oauthRouter.js';
import { getMicrosoftRouter } from '../microsoft/microsoftRoutes.js';
import { getSlackRouter } from '../slack/slackRoutes.js';
import { getCanvaRouter } from '../canva/canvaRoutes.js';
import { getBasecampRouter } from '../basecamp/basecampRoutes.js';
import { getQuickBooksRouter } from '../quickbooks/quickbooksRoutes.js';
import { getRechatRouter } from '../rechat/rechatRoutes.js';
import { getApiNationDotloopRouter } from '../apinationDotloop/apinationDotloopRoutes.js';
import { getNotificationRouter } from '../../notifications/notificationRoutes.js';
import { signJwt } from '../../auth/jwt.js';
import * as emailProvider from '../../email/emailProvider.js';

const WORKSPACE = 'ws_wilmington';

type MountedRoute = { method: string; path: string };

function enumerateRouterRoutes(router: Router): MountedRoute[] {
  const stack = (router as unknown as { stack?: Array<{ route?: { path: string | string[]; methods: Record<string, boolean> } }> }).stack || [];
  const routes: MountedRoute[] = [];
  for (const layer of stack) {
    if (!layer.route) continue;
    const paths = Array.isArray(layer.route.path) ? layer.route.path : [layer.route.path];
    for (const path of paths) {
      for (const [method, enabled] of Object.entries(layer.route.methods)) {
        if (!enabled || method === '_all') continue;
        routes.push({ method: method.toUpperCase(), path });
      }
    }
  }
  return routes;
}

function isOAuthCallback(path: string): boolean {
  return /(?:^|\/)callback\/?$/.test(path);
}

function concretePath(path: string): string {
  return path.replace(/:([^/]+)/g, 'probe-$1');
}

function sessionToken(user: { id: string; email: string; name: string; role: string }): string {
  return signJwt({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    workspaceId: WORKSPACE,
  });
}

const limitedUser = {
  id: 'usr_eric',
  email: 'eric@nestrealty.com',
  name: 'Eric Knight',
  role: 'bic',
};

const managerUser = {
  id: 'usr_admin',
  email: 'admin@shapework.co',
  name: 'Platform Admin',
  role: 'admin',
};

const probeBody = {
  draftId: 'drf_sign_304',
  toEmail: 'outside@example.com',
  toName: 'Outside',
  subject: 'probe',
  bodyText: 'probe body',
  fromEmail: 'vendor@example.com',
  fromName: 'Vendor',
  propertyAddress: '1 Main St',
  title: 'probe event',
  location: 'Wilmington',
  startTime: '2026-09-24T15:00:00.000Z',
  endTime: '2026-09-24T16:00:00.000Z',
  attendees: [{ email: 'outside@example.com', name: 'Outside' }],
  folderId: 'folder-probe',
  name: 'Probe Folder',
  driveFolderId: 'drive-probe',
  content: 'probe',
};

describe('googleRoutes session guard', () => {
  let server: Server;
  let baseUrl: string;
  const sendEmail = vi.spyOn(emailProvider, 'sendEmail').mockResolvedValue({
    messageId: 'probe-should-not-send',
    suppressed: false,
  } as never);
  const gmailApi = vi.spyOn(google, 'gmail').mockReturnValue({} as never);
  const driveApi = vi.spyOn(google, 'drive').mockReturnValue({} as never);

  const dbState = { workspaceIntegrationConnections: [], saveStateToStorage: async () => {} };
  const googleRouter = getGoogleRouter(dbState, dbState.saveStateToStorage);
  const googleRoutes = enumerateRouterRoutes(googleRouter);

  beforeAll(async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/integrations/google', googleRouter);
    app.use('/api/auth', oauthRouter);
    app.use('/api/integrations/microsoft', getMicrosoftRouter(dbState, async () => {}));
    app.use('/api/integrations/slack', getSlackRouter(dbState, async () => {}));
    app.use('/api/integrations/canva', getCanvaRouter(dbState, async () => {}));
    app.use('/api/integrations/basecamp', getBasecampRouter(dbState, async () => {}));
    app.use('/api/integrations/quickbooks', getQuickBooksRouter(dbState, async () => {}));
    app.use('/api/integrations/rechat', getRechatRouter(dbState));
    app.use('/api/integrations/dotloop', getApiNationDotloopRouter(dbState));
    app.use('/api/notifications', getNotificationRouter(dbState, () => {}));
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address() as { port: number };
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    sendEmail.mockRestore();
    gmailApi.mockRestore();
    driveApi.mockRestore();
    if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  afterEach(() => {
    sendEmail.mockClear();
    gmailApi.mockClear();
    driveApi.mockClear();
  });

  async function call(route: MountedRoute, headers: Record<string, string> = {}) {
    const response = await fetch(`${baseUrl}/api/integrations/google${concretePath(route.path)}`, {
      method: route.method,
      headers: { 'content-type': 'application/json', ...headers },
      body: route.method === 'GET' || route.method === 'HEAD' ? undefined : JSON.stringify(probeBody),
    });
    const text = await response.text();
    return { status: response.status, text };
  }

  it('enumerates every google route from the router, including the open hub and gmail routes', () => {
    const paths = googleRoutes.map((route) => `${route.method} ${route.path}`);
    expect(googleRoutes.length).toBeGreaterThan(20);
    expect(paths).toContain('POST /gmail/create-draft');
    expect(paths).toContain('POST /gmail/send-draft');
    expect(paths).toContain('GET /hub/status');
    expect(paths).toContain('GET /callback');
    expect(paths).toContain('GET /connect');
    expect(paths).toContain('GET /start');
  });

  it('returns 401 for every google route when there is no session', async () => {
    expect(googleRoutes.length).toBeGreaterThan(0);
    const failures: string[] = [];
    for (const route of googleRoutes) {
      const res = await call(route);
      if (res.status !== 401) failures.push(`${route.method} ${route.path} -> ${res.status}`);
    }
    expect(failures).toEqual([]);
  });

  it('returns 403 for a session without manage_integrations, except the OAuth callback', async () => {
    const headers = { 'x-session-token': sessionToken(limitedUser) };
    const failures: string[] = [];
    for (const route of googleRoutes) {
      if (isOAuthCallback(route.path)) continue;
      const res = await call(route, headers);
      if (res.status !== 403) failures.push(`${route.method} ${route.path} -> ${res.status} ${res.text.slice(0, 120)}`);
    }
    expect(failures).toEqual([]);
  });

  it('requires the CSRF header on mutating google routes', async () => {
    const headers = { 'x-session-token': sessionToken(managerUser) };
    const failures: string[] = [];
    for (const route of googleRoutes) {
      if (isOAuthCallback(route.path)) continue;
      if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(route.method)) continue;
      const res = await call(route, headers);
      if (res.status !== 403 || !/csrf/i.test(res.text)) {
        failures.push(`${route.method} ${route.path} -> ${res.status} ${res.text.slice(0, 160)}`);
      }
    }
    expect(failures).toEqual([]);

    const allowed = await call(
      { method: 'POST', path: '/gmail/create-draft' },
      { ...headers, 'x-shapework-csrf': 'probe' }
    );
    expect(allowed.status).not.toBe(401);
    expect(allowed.status).not.toBe(403);
  });

  it('does not call sendEmail for unauthenticated create-draft or send-draft', async () => {
    sendEmail.mockClear();
    const create = await call({ method: 'POST', path: '/gmail/create-draft' });
    const send = await call({ method: 'POST', path: '/gmail/send-draft' });
    expect(create.status).toBe(401);
    expect(send.status).toBe(401);
    expect(sendEmail).not.toHaveBeenCalled();
    expect(gmailApi).not.toHaveBeenCalled();
    expect(driveApi).not.toHaveBeenCalled();
  });

  it('keeps the OAuth callback on its state check instead of manage_integrations', async () => {
    const res = await call(
      { method: 'GET', path: '/callback' },
      { 'x-session-token': sessionToken(limitedUser) }
    );
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it('does not reach sendEmail or Gmail/Drive APIs from mounted routes without a session', async () => {
    const mounts: Array<{ base: string; router: Router }> = [
      { base: '/api/integrations/google', router: googleRouter },
      { base: '/api/integrations/microsoft', router: getMicrosoftRouter(dbState, async () => {}) },
      { base: '/api/integrations/slack', router: getSlackRouter(dbState, async () => {}) },
      { base: '/api/integrations/canva', router: getCanvaRouter(dbState, async () => {}) },
      { base: '/api/integrations/basecamp', router: getBasecampRouter(dbState, async () => {}) },
      { base: '/api/integrations/quickbooks', router: getQuickBooksRouter(dbState, async () => {}) },
      { base: '/api/integrations/rechat', router: getRechatRouter(dbState) },
      { base: '/api/integrations/dotloop', router: getApiNationDotloopRouter(dbState) },
      { base: '/api/notifications', router: getNotificationRouter(dbState, () => {}) },
      { base: '/api/auth', router: oauthRouter },
    ];

    const leaks: string[] = [];
    for (const mount of mounts) {
      for (const route of enumerateRouterRoutes(mount.router)) {
        sendEmail.mockClear();
        gmailApi.mockClear();
        driveApi.mockClear();
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 2500);
        try {
          await fetch(`${baseUrl}${mount.base}${concretePath(route.path)}`, {
            method: route.method,
            headers: { 'content-type': 'application/json' },
            body: route.method === 'GET' || route.method === 'HEAD' ? undefined : JSON.stringify(probeBody),
            signal: controller.signal,
          });
        } catch {
          // A timeout still counts if a client was already constructed.
        } finally {
          clearTimeout(timer);
        }
        if (sendEmail.mock.calls.length || gmailApi.mock.calls.length || driveApi.mock.calls.length) {
          leaks.push(`${route.method} ${mount.base}${route.path} sendEmail=${sendEmail.mock.calls.length} gmail=${gmailApi.mock.calls.length} drive=${driveApi.mock.calls.length}`);
        }
      }
    }
    expect(leaks).toEqual([]);
  });
});
