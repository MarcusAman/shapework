/**
 * Default-deny gate: every registered /api route is taken from the Express
 * stack (routers included). A request with no session must 401
 * authentication_required before the handler runs, unless the route is on
 * the exported PUBLIC allowlist.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import http, { IncomingMessage, ServerResponse } from 'http';
import { Duplex } from 'stream';
import type { Express } from 'express';
import type { Server } from 'http';
import { signJwt } from './auth/jwt.js';
import {
  PUBLIC_API_ROUTES,
  isPublicApiRoute,
  registeredApiRoutes,
} from './auth/defaultDenyApi.js';

const EXPECTED_PUBLIC = [
  'GET /api/auth/:provider/callback',
  'GET /api/health',
  'GET /api/integrations/:provider/callback',
  'GET /api/integrations/basecamp/callback',
  'GET /api/integrations/canva/callback',
  'GET /api/integrations/google/callback',
  'GET /api/integrations/microsoft/callback',
  'GET /api/integrations/quickbooks/callback',
  'GET /api/integrations/rechat/oauth/callback',
  'GET /api/integrations/slack/callback',
  'GET /api/version',
  'POST /api/auth/activate',
  'POST /api/auth/forgot-password',
  'POST /api/auth/login',
  'POST /api/auth/logout',
  'POST /api/auth/reset-password',
  'POST /api/contracts/esign/webhook',
  'POST /api/internal/jobs/evaluate-task-slas',
  'POST /api/retell/call-ended',
  'POST /api/retell/nest-ops/call-analysis-webhook',
  'POST /api/retell/nest-ops/inbound-sms-webhook',
  'POST /api/retell/nest-ops/inbound-webhook',
  'POST /api/retell/webhook',
  'POST /api/vendors/webhook/:vendorId',
  'POST /api/webhooks/resend',
  'POST /api/webhooks/zapier/:workspaceId/:secret',
];

type Handle = (...args: unknown[]) => unknown;
type Layer = {
  route?: { stack?: Array<{ handle: Handle }> };
  handle?: { stack?: Layer[] };
};

const handlerCalls: string[] = [];

function wrapHandlers(stack: Layer[]) {
  for (const layer of stack) {
    for (const sub of layer.route?.stack || []) {
      const original = sub.handle;
      if ((original as Handle & { __gateWrapped?: boolean }).__gateWrapped) continue;
      const wrapped: Handle = function (this: unknown, ...args: unknown[]) {
        const req = args[0] as { method?: string; originalUrl?: string };
        handlerCalls.push(`${req?.method || ''} ${req?.originalUrl || ''}`);
        return original.apply(this, args);
      };
      (wrapped as Handle & { __gateWrapped?: boolean }).__gateWrapped = true;
      sub.handle = wrapped;
    }
    if (layer.handle?.stack) wrapHandlers(layer.handle.stack);
  }
}

function concretePath(routePath: string): string {
  return routePath.replace(/:([^/]+)/g, 'probe-$1');
}

function probe(baseUrl: string, method: string, routePath: string): Promise<{ status: number; text: string }> {
  const target = new URL(concretePath(routePath), baseUrl);
  const body = method === 'GET' || method === 'HEAD' ? undefined : '{}';
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        protocol: target.protocol,
        hostname: target.hostname,
        port: target.port,
        path: `${target.pathname}${target.search}`,
        method,
        headers: body
          ? { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) }
          : undefined,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          resolve({ status: res.statusCode || 0, text: Buffer.concat(chunks).toString('utf8') });
        });
      },
    );
    req.setTimeout(4000, () => {
      req.destroy(new Error('timeout'));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

// Node's HTTP server emits "connect" instead of "request", so CONNECT never
// reaches Express over the wire. Dispatch it through the app stack directly.
function probeConnect(app: Express, routePath: string): Promise<{ status: number; text: string }> {
  const socket = new Duplex({
    read() {},
    write(_chunk, _enc, cb) { cb(); },
  });
  const req = new IncomingMessage(socket as never);
  const target = concretePath(routePath);
  req.method = 'CONNECT';
  req.url = target;
  req.headers = { host: '127.0.0.1', 'content-type': 'application/json' };
  const res = new ServerResponse(req);
  res.assignSocket(socket as never);
  const chunks: Buffer[] = [];
  const origEnd = res.end.bind(res);
  res.end = ((chunk?: unknown, ...args: unknown[]) => {
    if (chunk != null) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
    return origEnd(chunk as never, ...(args as never[]));
  }) as typeof res.end;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), 4000);
    res.on('finish', () => {
      clearTimeout(timer);
      resolve({ status: res.statusCode || 0, text: Buffer.concat(chunks).toString('utf8') });
    });
    res.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    app(req, res);
  });
}

function label(route: { method: string; path: string }): string {
  return `${route.method} ${route.path}`;
}

describe('default-deny /api gate', () => {
  let app: Express;
  let httpServer: Server;
  let baseUrl = '';

  beforeAll(async () => {
    const loaded = await import('../server.ts');
    app = loaded.app;
    httpServer = loaded.httpServer;
    wrapHandlers((app as unknown as { _router: { stack: Layer[] } })._router.stack);
    await new Promise<void>((resolve) => {
      if (httpServer.listening) {
        const addr = httpServer.address() as { port: number };
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
        return;
      }
      httpServer.once('listening', () => {
        const addr = httpServer.address() as { port: number };
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  }, 180000);

  afterAll(async () => {
    if (httpServer) {
      await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    }
  });

  it('pins the public allowlist so a new public route must edit this test', () => {
    const exported = PUBLIC_API_ROUTES.map(label).sort();
    expect(exported).toEqual([...EXPECTED_PUBLIC].sort());
    expect(new Set(exported).size).toBe(exported.length);
  });

  it('rejects every non-public /api route with no session before the handler runs', async () => {
    const routes = registeredApiRoutes(app);
    expect(routes.length).toBeGreaterThan(100);

    const registered = new Set(routes.map(label));
    const missing = EXPECTED_PUBLIC.filter((entry) => !registered.has(entry));
    expect(missing).toEqual([]);

    const failures: string[] = [];
    const seen = new Set<string>();
    for (const route of routes) {
      const key = label(route);
      if (seen.has(key)) continue;
      seen.add(key);
      const before = handlerCalls.length;
      let status = 0;
      let text = '';
      try {
        const response = route.method === 'CONNECT'
          ? await probeConnect(app, route.path)
          : await probe(baseUrl, route.method, route.path);
        status = response.status;
        text = response.text;
      } catch (err) {
        status = 0;
        text = err instanceof Error ? err.message : 'request failed';
      }
      const ran = handlerCalls.length > before;
      if (isPublicApiRoute(route.method, route.path)) continue;
      if (status !== 401 || ran) {
        failures.push(`${key} -> ${status || 'timeout'}${ran ? ' handler ran' : ''} ${text.slice(0, 120)}`);
        continue;
      }
      if (route.method === 'HEAD') continue;
      try {
        const body = JSON.parse(text);
        if (body.error !== 'authentication_required') {
          failures.push(`${key} body ${text.slice(0, 120)}`);
        }
      } catch {
        failures.push(`${key} non-json ${text.slice(0, 120)}`);
      }
    }
    expect(failures).toEqual([]);
  }, 300000);

  it('makes email-intake/sync POST-only and session-gated', async () => {
    const get = await fetch(`${baseUrl}/api/marketing/email-intake/sync`);
    expect([404, 405]).toContain(get.status);

    const post = await fetch(`${baseUrl}/api/marketing/email-intake/sync`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });
    expect(post.status).toBe(401);
    const body = await post.json();
    expect(body.error).toBe('authentication_required');
  });

  it('rejects purge-all-data without a session and for a non-admin session', async () => {
    const anon = await fetch(`${baseUrl}/api/marketing/purge-all-data`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });
    expect(anon.status).toBe(401);
    expect((await anon.json()).error).toBe('authentication_required');

    const token = signJwt({
      userId: 'usr_eric',
      email: 'eric@nestrealty.com',
      name: 'Eric Knight',
      role: 'bic',
      workspaceId: 'ws_wilmington',
    });
    const denied = await fetch(`${baseUrl}/api/marketing/purge-all-data`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-session-token': token,
        'x-shapework-csrf': 'probe',
      },
      body: '{}',
    });
    expect(denied.status).toBe(403);
    const deniedBody = await denied.json();
    expect(JSON.stringify(deniedBody).toLowerCase()).not.toContain('csrf');
  });
});
