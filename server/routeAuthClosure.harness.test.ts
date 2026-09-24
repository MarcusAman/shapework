/**
 * Extends the route-auth harness. Routes are discovered from server.ts and
 * from every router it mounts — the list is not hand-picked.
 *
 * Every route that can reach sendEmail, the Gmail/Drive/Chat APIs, a token
 * store read, or an integration connection write must reject a request with
 * no session. The only allowlist entries are OAuth callbacks.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import express from 'express';
import type { Server } from 'http';
import type { Router } from 'express';
import { google } from 'googleapis';
import { signJwt } from './auth/jwt.js';
import { requireAuth } from './auth/auth.js';
import * as emailProvider from './email/emailProvider.js';
import { ResendEmailProvider } from './notifications/notificationProvider.js';
import { IntegrationStateStore } from './integrations/shared/integrationStateStore.js';
import { tokenStore } from './integrations/rechat/rechatTokenStore.js';
import { saveOAuthTokenRecord } from './persistence/oauthTokensRepository.js';
import { generateMicrosoftOAuthState, microsoftActiveStates, validateMicrosoftOAuthState } from './integrations/microsoft/microsoftOAuth.js';
import { generateOAuthState as generateBasecampOAuthState, basecampActiveStates, validateOAuthState as validateBasecampOAuthState } from './integrations/basecamp/basecampOAuth.js';
import { generateOAuthState as generateQuickBooksOAuthState, activeStates as quickbooksActiveStates, validateOAuthState as validateQuickBooksOAuthState } from './integrations/quickbooks/quickbooksOAuth.js';
import { rechatAuth, rechatActiveStates } from './integrations/rechat/rechatAuth.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SERVER_TS = path.join(ROOT, 'server.ts');
const WORKSPACE = 'ws_wilmington';

const CAPABILITY = /sendEmail|sendGmailEmail|sendOutlookEmail|dispatchEmailViaResend|deliverResendEmail|google\.gmail\b|google\.drive\b|google\.chat\b|getOAuthTokenRecord|getAllOAuthTokenRecords|tokenStore\.(?:getTokens|saveTokens)|upsertConnection|workspaceIntegrationConnections|integration_connections|\.connected\s*=\s*true/;

type MountedRoute = { method: string; path: string; mount: string; file: string };

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

function sessionToken(user: { id: string; email: string; name: string; role: string }): string {
  return signJwt({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    workspaceId: WORKSPACE,
  });
}

function concretePath(routePath: string): string {
  return routePath.replace(/:([^/]+)/g, 'probe-$1');
}

function isOAuthCallback(fullPath: string): boolean {
  const bare = fullPath.split('?')[0];
  return /\/callback\/?$/.test(bare) || /\/oauth\/callback\/?$/.test(bare);
}

function extractCalls(source: string, keyword: string): string[] {
  const calls: string[] = [];
  let from = 0;
  while (from < source.length) {
    const at = source.indexOf(keyword, from);
    if (at === -1) break;
    const open = at + keyword.length - 1;
    if (source[open] !== '(') {
      from = at + keyword.length;
      continue;
    }
    let depth = 0;
    let j = open;
    for (; j < source.length; j++) {
      const ch = source[j];
      if (ch === '(') depth++;
      else if (ch === ')') {
        depth--;
        if (depth === 0) {
          j++;
          break;
        }
      }
    }
    calls.push(source.slice(at, j));
    from = j;
  }
  return calls;
}

function firstStringArg(call: string): string {
  const open = call.indexOf('(');
  const rest = call.slice(open + 1).trim();
  if (rest.startsWith('[')) {
    const end = rest.indexOf(']');
    return rest.slice(0, end + 1);
  }
  const quote = rest[0];
  if (quote === "'" || quote === '"' || quote === '`') {
    const end = rest.indexOf(quote, 1);
    return rest.slice(1, end);
  }
  return '';
}

function enumerateRouterRoutes(router: Router, mount: string, file: string): MountedRoute[] {
  const stack = (router as unknown as { stack?: Array<{ route?: { path: string | string[]; methods: Record<string, boolean> } }> }).stack || [];
  const routes: MountedRoute[] = [];
  for (const layer of stack) {
    if (!layer.route) continue;
    const paths = Array.isArray(layer.route.path) ? layer.route.path : [layer.route.path];
    for (const routePath of paths) {
      for (const [method, enabled] of Object.entries(layer.route.methods)) {
        if (!enabled || method === '_all') continue;
        routes.push({ method: method.toUpperCase(), path: routePath, mount, file });
      }
    }
  }
  return routes;
}

function resolveModule(fromFile: string, spec: string): string | null {
  if (!spec.startsWith('.')) return null;
  const base = path.resolve(path.dirname(fromFile), spec).replace(/\.js$/, '');
  const candidates = [`${base}.ts`, `${base}.tsx`, `${base}.js`, base, path.join(base, 'index.ts')];
  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

const fileText = new Map<string, string>();
function readSource(file: string): string {
  const cached = fileText.get(file);
  if (cached !== undefined) return cached;
  const text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  fileText.set(file, text);
  return text;
}

function functionBody(file: string, name: string): string {
  const source = readSource(file);
  const re = new RegExp(`(?:async\\s+)?function\\s+${name}\\b|class\\s+${name}\\b|(?:const|let)\\s+${name}\\b`);
  const match = re.exec(source);
  if (!match) return '';
  const brace = source.indexOf('{', match.index);
  if (brace < 0) return '';
  let depth = 0;
  for (let i = brace; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) return source.slice(match.index, i + 1);
    }
  }
  return '';
}

const dangerousNameCache = new Map<string, Set<string>>();

function dangerousLocalNames(file: string, depth = 0): Set<string> {
  const cacheKey = `${depth}:${file}`;
  const cached = dangerousNameCache.get(cacheKey);
  if (cached) return cached;
  const names = new Set<string>();
  dangerousNameCache.set(cacheKey, names);
  if (depth > 2) return names;
  const source = readSource(file);
  for (const match of source.matchAll(/import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g)) {
    const resolved = resolveModule(file, match[2]);
    if (!resolved) continue;
    for (const part of match[1].split(',')) {
      const piece = part.trim();
      if (!piece || piece.startsWith('type ')) continue;
      const [exported, alias] = piece.split(/\s+as\s+/i);
      const local = (alias || exported).trim();
      const exportedName = exported.trim();
      const body = functionBody(resolved, exportedName);
      if (/^\s*(?:export\s+)?class\b/.test(body) || body.includes(`class ${exportedName}`)) continue;
      if (CAPABILITY.test(exportedName) || (body && CAPABILITY.test(body))) names.add(local);
    }
  }
  return names;
}

function routeChunks(file: string): Array<{ method: string; path: string; body: string; registration: string }> {
  const source = readSource(file);
  const re = /^[ \t]*(?:app|router|[A-Za-z0-9_]+Router)\.(get|post|put|patch|delete|use)\(/gm;
  const starts: Array<{ index: number; method: string }> = [];
  for (const match of source.matchAll(re)) starts.push({ index: match.index || 0, method: match[1].toUpperCase() });
  return starts.map((start, index) => {
    const end = starts[index + 1]?.index ?? Math.min(source.length, start.index + 6000);
    const raw = source.slice(start.index, end);
    const body = handlerOnly(raw);
    const call = extractCalls(raw, raw.slice(0, raw.indexOf('(') + 1))[0] || raw.slice(0, 500);
    return {
      method: start.method,
      path: firstStringArg(call),
      body,
      registration: call,
    };
  }).filter((chunk) => chunk.method !== 'USE' && chunk.path.startsWith('/'));
}

function handlerOnly(body: string): string {
  const lines = body.split('\n');
  const kept = [lines[0]];
  for (let i = 1; i < lines.length; i++) {
    if (/^(?:export\s+|async\s+function\s|function\s|const\s|let\s|class\s|app\.|router\.)/.test(lines[i])) break;
    kept.push(lines[i]);
  }
  return kept.join('\n');
}

function methodBody(ownerBody: string, method: string): string {
  const re = new RegExp(`(?:async\\s+)?${method}\\s*\\(`);
  const match = re.exec(ownerBody);
  if (!match) return '';
  const brace = ownerBody.indexOf('{', match.index);
  if (brace < 0) return '';
  let depth = 0;
  for (let i = brace; i < ownerBody.length; i++) {
    if (ownerBody[i] === '{') depth++;
    else if (ownerBody[i] === '}') {
      depth--;
      if (depth === 0) return ownerBody.slice(match.index, i + 1);
    }
  }
  return '';
}

function methodCanReachCapability(ownerBody: string, method: string, depth = 0): boolean {
  const body = methodBody(ownerBody, method);
  if (!body) return false;
  if (CAPABILITY.test(body)) return true;
  if (depth > 0) return false;
  for (const call of body.matchAll(/this\.([A-Za-z0-9_]+)\s*\(/g)) {
    if (methodCanReachCapability(ownerBody, call[1], depth + 1)) return true;
  }
  return false;
}

function pathsOf(chunkPath: string): string[] {
  if (chunkPath.startsWith('[')) {
    return [...chunkPath.matchAll(/['"`]([^'"`]+)['"`]/g)].map((match) => match[1]);
  }
  return chunkPath ? [chunkPath] : [];
}

function chunkFor(file: string, method: string, routePath: string) {
  return routeChunks(file).find((chunk) => chunk.method === method && pathsOf(chunk.path).includes(routePath));
}

function dangerReason(file: string, body: string): string {
  const direct = body.match(CAPABILITY);
  if (direct) return `direct:${direct[0]}`;
  for (const call of body.matchAll(/\b([A-Za-z_][A-Za-z0-9_]*)\s*\(/g)) {
    const local = functionBody(file, call[1]);
    if (local && !local.includes(`class ${call[1]}`) && CAPABILITY.test(local)) return `local:${call[1]}`;
  }
  for (const name of dangerousLocalNames(file)) {
    if (new RegExp(`\\b${name}\\b`).test(body)) return `import:${name}`;
  }
  const source = readSource(file);
  for (const match of source.matchAll(/import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g)) {
    const resolved = resolveModule(file, match[2]);
    if (!resolved) continue;
    for (const part of match[1].split(',')) {
      const piece = part.trim();
      if (!piece) continue;
      const [exported, alias] = piece.split(/\s+as\s+/i);
      const local = (alias || exported).trim();
      const owner = functionBody(resolved, exported.trim());
      if (!owner.includes(`class ${exported.trim()}`)) continue;
      for (const call of body.matchAll(new RegExp(`\\b${local}\\.([A-Za-z0-9_]+)\\s*\\(`, 'g'))) {
        if (methodCanReachCapability(owner, call[1])) return `method:${local}.${call[1]}`;
      }
    }
  }
  for (const match of body.matchAll(/(?:const|let)\s*\{([^}]+)\}\s*=\s*await\s+import\(\s*['"]([^'"]+)['"]\s*\)/g)) {
    const resolved = resolveModule(file, match[2]);
    if (!resolved) continue;
    for (const part of match[1].split(',')) {
      const name = part.trim().split(/\s+as\s+/i).pop()!.trim();
      const owner = functionBody(resolved, name);
      if (CAPABILITY.test(name) || (owner && CAPABILITY.test(owner) && !owner.includes(`class ${name}`))) return `dynamic:${name}`;
      if (owner.includes(`class ${name}`)) {
        for (const call of body.matchAll(new RegExp(`\\b${name}\\.([A-Za-z0-9_]+)`, 'g'))) {
          if (methodCanReachCapability(owner, call[1])) return `dynamic:${name}.${call[1]}`;
        }
      }
    }
  }
  return '';
}

function isDangerousChunk(file: string, body: string): boolean {
  return dangerReason(file, body) !== '';
}

type LoadedMount = { mount: string; router: Router; file: string; sessionGated: boolean };

async function loadMountedRouters(dbState: any): Promise<LoadedMount[]> {
  const source = readSource(SERVER_TS);
  const imported = new Map<string, string>();
  for (const match of source.matchAll(/import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g)) {
    const spec = match[2];
    for (const part of match[1].split(',')) {
      const name = part.trim().split(/\s+as\s+/i).pop()!.trim();
      if (name) imported.set(name, spec);
    }
  }
  for (const match of source.matchAll(/import\s+([A-Za-z0-9_]+)\s+from\s+['"]([^'"]+)['"]/g)) {
    imported.set(match[1], match[2]);
  }

  const mounts: LoadedMount[] = [];
  const seen = new Set<string>();
  for (const call of extractCalls(source, 'app.use(')) {
    const names = [...call.matchAll(/\b([A-Za-z_][A-Za-z0-9_]*)\b/g)].map((match) => match[1]);
    const routerName = [...names].reverse().find((name) => imported.has(name) && /Router/.test(name));
    if (!routerName) continue;
    const spec = imported.get(routerName)!;
    const resolved = resolveModule(SERVER_TS, spec);
    if (!resolved) continue;
    const key = `${call.slice(0, 180)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const mod = await import(pathToFileURL(resolved).href);
    const binding = mod[routerName];
    let router: Router | null = null;
    if (binding && (binding as Router).stack) router = binding as Router;
    else if (typeof binding === 'function') {
      try {
        const created = binding(dbState, async () => {});
        if (created && created.stack) router = created as Router;
      } catch {
        continue;
      }
    }
    if (!router) continue;
    const mount = firstStringArg(call);
    const sessionGated = /\brequireAuth\b/.test(call);
    mounts.push({ mount, router, file: resolved, sessionGated });
  }
  return mounts;
}

function fullPath(route: MountedRoute): string {
  if (!route.mount) return route.path;
  if (route.path.startsWith('/api/') || route.path.startsWith('/dev/')) return route.path;
  return `${route.mount}${route.path.startsWith('/') ? route.path : `/${route.path}`}`;
}

describe('route auth closure', () => {
  const serverSource = readSource(SERVER_TS);
  const dbState: any = {
    workspaceIntegrationConnections: [],
    integrations: [
      { id: 'i_slack', connected: false },
      { id: 'i_canva', connected: false },
      { id: 'i_rechat', connected: false },
    ],
    auditEvents: [],
    basecampConnections: [],
    quickbooksConnections: [],
    settings: {},
    workItems: [],
    saveStateToStorage: async () => {},
  };

  let server: Server;
  let baseUrl = '';
  let discovered: MountedRoute[] = [];
  let inlineRoutes: Array<{ method: string; path: string; registration: string; dangerous: boolean }> = [];

  const sendEmail = vi.spyOn(emailProvider, 'sendEmail').mockResolvedValue({ messageId: 'probe-should-not-send', suppressed: false } as never);
  const resendSend = vi.spyOn(ResendEmailProvider.prototype, 'sendEmail').mockResolvedValue({} as never);
  const gmailApi = vi.spyOn(google, 'gmail').mockReturnValue({} as never);
  const driveApi = vi.spyOn(google, 'drive').mockReturnValue({} as never);
  const chatApi = vi.spyOn(google, 'chat').mockReturnValue({} as never);
  const upsertConnection = vi.spyOn(IntegrationStateStore.prototype, 'upsertConnection');
  const readRechatTokens = vi.spyOn(tokenStore, 'getTokens');
  const saveRechatTokens = vi.spyOn(tokenStore, 'saveTokens');

  beforeAll(async () => {
    process.env.ACTIVE_TENANT_DIR = path.join('/tmp', 'shapework-oauth-route-auth');
    fs.mkdirSync(process.env.ACTIVE_TENANT_DIR, { recursive: true });
    const mounts = await loadMountedRouters(dbState);
    const app = express();
    app.use(express.json());
    for (const mount of mounts) {
      const gate = mount.sessionGated ? [requireAuth] : [];
      if (mount.mount) app.use(mount.mount, ...gate, mount.router);
      else app.use(...gate, mount.router);
      discovered.push(...enumerateRouterRoutes(mount.router, mount.mount, mount.file));
    }
    inlineRoutes = routeChunks(SERVER_TS)
      .filter((chunk) => chunk.path.startsWith('/'))
      .map((chunk) => ({
        method: chunk.method,
        path: chunk.path,
        registration: chunk.registration,
        dangerous: isDangerousChunk(SERVER_TS, chunk.body),
      }));
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address() as { port: number };
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  }, 120000);

  afterAll(async () => {
    sendEmail.mockRestore();
    resendSend.mockRestore();
    gmailApi.mockRestore();
    driveApi.mockRestore();
    chatApi.mockRestore();
    upsertConnection.mockRestore();
    readRechatTokens.mockRestore();
    saveRechatTokens.mockRestore();
    if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  function clearSpies() {
    sendEmail.mockClear();
    resendSend.mockClear();
    gmailApi.mockClear();
    driveApi.mockClear();
    chatApi.mockClear();
    upsertConnection.mockClear();
    readRechatTokens.mockClear();
    saveRechatTokens.mockClear();
  }

  function leaked(): boolean {
    return Boolean(
      sendEmail.mock.calls.length ||
      resendSend.mock.calls.length ||
      gmailApi.mock.calls.length ||
      driveApi.mock.calls.length ||
      chatApi.mock.calls.length ||
      upsertConnection.mock.calls.length ||
      readRechatTokens.mock.calls.length ||
      saveRechatTokens.mock.calls.length
    );
  }

  async function probe(method: string, urlPath: string, headers: Record<string, string> = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    try {
      const response = await fetch(`${baseUrl}${urlPath}`, {
        method,
        headers: { 'content-type': 'application/json', ...headers },
        body: method === 'GET' || method === 'HEAD' ? undefined : JSON.stringify({
          draftId: 'drf_sign_304',
          toEmail: 'outside@example.com',
          recipientId: 'usr_eric',
          actionType: 'approve_action',
          text: 'probe',
          recipientEmail: 'outside@example.com',
        }),
        redirect: 'manual',
        signal: controller.signal,
      });
      const text = await response.text();
      return { status: response.status, text };
    } finally {
      clearTimeout(timer);
    }
  }

  it('enumerates server.ts routes and every mounted router', () => {
    expect(inlineRoutes.length).toBeGreaterThan(40);
    expect(discovered.length).toBeGreaterThan(40);
    const inlinePaths = inlineRoutes.map((route) => `${route.method} ${route.path}`);
    expect(inlinePaths.some((line) => line.includes('/api/integrations/google/'))).toBe(false);
    const discoveredPaths = discovered.map((route) => `${route.method} ${fullPath(route)}`);
    expect(discoveredPaths).toContain('GET /api/google-chat/spaces');
    expect(discoveredPaths).toContain('POST /api/google-chat/send');
    expect(discoveredPaths).toContain('POST /api/google-chat/create-dm');
    expect(discoveredPaths).toContain('POST /api/marketing/sla/evaluate-all');
    expect(discoveredPaths).toContain('POST /api/notifications/trigger');
    expect(discoveredPaths).toContain('GET /api/auth/:provider/status');
    expect(discoveredPaths).toEqual(expect.arrayContaining([
      'GET /api/integrations/microsoft/callback',
      'GET /api/integrations/slack/callback',
      'GET /api/integrations/canva/callback',
      'GET /api/integrations/basecamp/callback',
      'GET /api/integrations/quickbooks/callback',
      'GET /api/integrations/rechat/oauth/callback',
    ]));
  });

  it('deletes the shadowed /api/integrations/google handlers from server.ts', () => {
    expect(serverSource).not.toMatch(/app\.(?:get|post|put|patch|delete)\(\s*['"]\/api\/integrations\/google\//);
  });

  it('requires a session and manage_integrations on google chat, with CSRF on mutations', async () => {
    const chatRoutes = discovered.filter((route) => fullPath(route).startsWith('/api/google-chat/'));
    expect(chatRoutes.map((route) => `${route.method} ${route.path}`).sort()).toEqual([
      'GET /messages/:spaceId',
      'GET /roster',
      'GET /spaces',
      'POST /create-dm',
      'POST /send',
    ]);
    const noSession: string[] = [];
    for (const route of chatRoutes) {
      const res = await probe(route.method, fullPath(route));
      if (res.status !== 401) noSession.push(`${route.method} ${route.path} -> ${res.status}`);
    }
    expect(noSession).toEqual([]);

    const limited = { 'x-session-token': sessionToken(limitedUser) };
    const denied: string[] = [];
    for (const route of chatRoutes) {
      const res = await probe(route.method, fullPath(route), limited);
      if (res.status !== 403) denied.push(`${route.method} ${route.path} -> ${res.status}`);
    }
    expect(denied).toEqual([]);

    const manager = { 'x-session-token': sessionToken(managerUser) };
    for (const route of chatRoutes.filter((item) => item.method === 'POST')) {
      const blocked = await probe(route.method, fullPath(route), manager);
      expect(blocked.status).toBe(403);
      expect(blocked.text).toMatch(/csrf/i);
      const allowed = await probe(route.method, fullPath(route), { ...manager, 'x-shapework-csrf': 'probe' });
      expect(allowed.status).not.toBe(401);
      expect(allowed.status).not.toBe(403);
    }
    expect(sendEmail).not.toHaveBeenCalled();
    expect(chatApi).not.toHaveBeenCalled();
  });

  it('requires a session and manage_integrations for on-demand SLA and notification trigger', async () => {
    clearSpies();
    const sla = await probe('POST', '/api/marketing/sla/evaluate-all');
    const trigger = await probe('POST', '/api/notifications/trigger');
    expect(sla.status).toBe(401);
    expect(trigger.status).toBe(401);
    expect(sendEmail).not.toHaveBeenCalled();
    expect(resendSend).not.toHaveBeenCalled();

    const limited = { 'x-session-token': sessionToken(limitedUser), 'x-shapework-csrf': 'probe' };
    const slaDenied = await probe('POST', '/api/marketing/sla/evaluate-all', limited);
    const triggerDenied = await probe('POST', '/api/notifications/trigger', limited);
    expect(slaDenied.status).toBe(403);
    expect(triggerDenied.status).toBe(403);
    expect(sendEmail).not.toHaveBeenCalled();
    expect(resendSend).not.toHaveBeenCalled();
  });

  it('requires a session for provider status and returns no token material', async () => {
    saveOAuthTokenRecord({
      provider: 'google',
      accessToken: 'secret-access-token',
      refreshToken: 'secret-refresh-token',
      expiresAt: '2030-01-01T00:00:00.000Z',
      status: 'connected',
      updatedAt: '2026-01-01T00:00:00.000Z',
      clientSecret: 'secret-client-secret',
    } as any);

    const anonymous = await probe('GET', '/api/auth/google/status');
    expect(anonymous.status).toBe(401);
    expect(anonymous.text).not.toContain('secret-access-token');
    expect(anonymous.text).not.toContain('secret-refresh-token');
    expect(anonymous.text).not.toContain('secret-client-secret');

    const authed = await probe('GET', '/api/auth/google/status', { 'x-session-token': sessionToken(limitedUser) });
    expect(authed.status).toBe(200);
    const body = JSON.parse(authed.text);
    expect(Object.keys(body).sort()).toEqual(['connected', 'expiresAt', 'provider', 'updatedAt']);
    expect(body).toEqual({
      connected: true,
      provider: 'google',
      updatedAt: '2026-01-01T00:00:00.000Z',
      expiresAt: '2030-01-01T00:00:00.000Z',
    });
    expect(authed.text).not.toMatch(/accessToken|refreshToken|clientSecret|secret-access-token|secret-refresh-token|secret-client-secret/);
  });

  it('binds Microsoft, Basecamp, QuickBooks, and Rechat callbacks to the starting session', async () => {
    const cases = [
      {
        name: 'microsoft',
        issue: () => generateMicrosoftOAuthState(WORKSPACE, managerUser.id),
        map: microsoftActiveStates,
        consume: (token: string) => validateMicrosoftOAuthState(token, WORKSPACE, managerUser.id),
        url: (token: string) => `/api/integrations/microsoft/callback?code=probe&state=${token}`,
      },
      {
        name: 'basecamp',
        issue: () => generateBasecampOAuthState(WORKSPACE, managerUser.id),
        map: basecampActiveStates,
        consume: (token: string) => validateBasecampOAuthState(token, WORKSPACE, managerUser.id),
        url: (token: string) => `/api/integrations/basecamp/callback?code=probe&state=${token}`,
      },
      {
        name: 'quickbooks',
        issue: () => generateQuickBooksOAuthState(WORKSPACE, managerUser.id),
        map: quickbooksActiveStates,
        consume: (token: string) => validateQuickBooksOAuthState(token, WORKSPACE, managerUser.id),
        url: (token: string) => `/api/integrations/quickbooks/callback?code=probe&state=${token}`,
      },
    ];

    for (const entry of cases) {
      const anonymousToken = entry.issue();
      const anonymous = await probe('GET', entry.url(anonymousToken));
      expect(anonymous.status, entry.name).toBe(401);
      expect(entry.map.has(anonymousToken), entry.name).toBe(true);

      const mismatchToken = entry.issue();
      const mismatch = await probe('GET', entry.url(mismatchToken), { 'x-session-token': sessionToken(limitedUser) });
      expect(mismatch.status, entry.name).toBe(400);
      expect(entry.map.has(mismatchToken), entry.name).toBe(true);

      const expiredToken = entry.issue();
      entry.map.get(expiredToken)!.expiresAt = Date.now() - 1000;
      const expired = await probe('GET', entry.url(expiredToken), { 'x-session-token': sessionToken(managerUser) });
      expect(expired.status, entry.name).toBe(400);
      expect(upsertConnection, entry.name).not.toHaveBeenCalled();
      expect(dbState.basecampConnections).toEqual([]);
      expect(dbState.quickbooksConnections).toEqual([]);
      expect(dbState.workspaceIntegrationConnections).toEqual([]);

      const replayToken = entry.issue();
      expect(entry.consume(replayToken)).toBe(true);
      const replay = await probe('GET', entry.url(replayToken), { 'x-session-token': sessionToken(managerUser) });
      expect(replay.status, entry.name).toBe(400);
      expect(entry.map.has(replayToken), entry.name).toBe(false);
    }

    const rechatAnonymous = rechatAuth.generateState(WORKSPACE, managerUser.id);
    expect((await probe('GET', `/api/integrations/rechat/oauth/callback?code=mock&state=${rechatAnonymous}`)).status).toBe(401);
    expect(rechatActiveStates.has(rechatAnonymous)).toBe(true);

    const rechatMismatch = rechatAuth.generateState(WORKSPACE, managerUser.id);
    expect((await probe('GET', `/api/integrations/rechat/oauth/callback?code=mock&state=${rechatMismatch}`, { 'x-session-token': sessionToken(limitedUser) })).status).toBe(400);
    expect(rechatActiveStates.has(rechatMismatch)).toBe(true);

    const rechatExpired = rechatAuth.generateState(WORKSPACE, managerUser.id);
    rechatActiveStates.get(rechatExpired)!.expiresAt = Date.now() - 1000;
    expect((await probe('GET', `/api/integrations/rechat/oauth/callback?code=mock&state=${rechatExpired}`, { 'x-session-token': sessionToken(managerUser) })).status).toBe(400);
    expect(saveRechatTokens).not.toHaveBeenCalled();
    expect(dbState.integrations.find((item: any) => item.id === 'i_rechat').connected).toBe(false);

    saveRechatTokens.mockClear();
    const rechatOnce = rechatAuth.generateState(WORKSPACE, managerUser.id);
    const first = await probe('GET', `/api/integrations/rechat/oauth/callback?code=mock&state=${rechatOnce}`, { 'x-session-token': sessionToken(managerUser) });
    expect(first.status).not.toBe(401);
    expect(rechatActiveStates.has(rechatOnce)).toBe(false);
    const second = await probe('GET', `/api/integrations/rechat/oauth/callback?code=mock&state=${rechatOnce}`, { 'x-session-token': sessionToken(managerUser) });
    expect(second.status).toBe(400);
    expect(saveRechatTokens.mock.calls.length).toBeLessThanOrEqual(1);
  });

  it('session-gates Slack and Canva callbacks because they do not issue OAuth state', async () => {
    const slack = await probe('GET', '/api/integrations/slack/callback?workspaceId=ws_wilmington');
    const canva = await probe('GET', '/api/integrations/canva/callback?workspaceId=ws_wilmington');
    expect(slack.status).toBe(401);
    expect(canva.status).toBe(401);
    expect(dbState.integrations.find((item: any) => item.id === 'i_slack').connected).toBe(false);
    expect(dbState.integrations.find((item: any) => item.id === 'i_canva').connected).toBe(false);

    const limited = { 'x-session-token': sessionToken(limitedUser) };
    expect((await probe('GET', '/api/integrations/slack/callback', limited)).status).toBe(403);
    expect((await probe('GET', '/api/integrations/canva/callback', limited)).status).toBe(403);
    expect(dbState.integrations.find((item: any) => item.id === 'i_slack').connected).toBe(false);
    expect(dbState.integrations.find((item: any) => item.id === 'i_canva').connected).toBe(false);
  });

  it('rejects unauthenticated access to every dangerous route except the OAuth callback allowlist', async () => {
    const dangerous = discovered.filter((route) => {
      const chunk = chunkFor(route.file, route.method, route.path);
      return Boolean(chunk && isDangerousChunk(route.file, chunk.body));
    });
    expect(dangerous.length).toBeGreaterThan(5);

    const allowlist: string[] = [];
    const offenders: string[] = [];
    for (const route of dangerous) {
      clearSpies();
      const target = concretePath(fullPath(route));
      let status = 0;
      try {
        const res = await probe(route.method, target);
        status = res.status;
      } catch {
        status = 0;
      }
      const label = `${route.method} ${fullPath(route)}`;
      if (leaked()) offenders.push(`${label} reached a protected capability`);
      if (isOAuthCallback(fullPath(route))) {
        allowlist.push(label);
        if (status > 0 && status < 400) offenders.push(`${label} completed without a session (${status})`);
        continue;
      }
      if (status !== 401) {
        const body = chunkFor(route.file, route.method, route.path)?.body || '';
        offenders.push(`${label} -> ${status || 'timeout'} (${dangerReason(route.file, body)})`);
      }
    }

    const unprotectedInline = inlineRoutes.filter((route) => route.dangerous && !/\brequireAuth\b/.test(route.registration) && !isOAuthCallback(route.path));
    for (const route of unprotectedInline) {
      offenders.push(`inline ${route.method} ${route.path} has no requireAuth (${dangerReason(SERVER_TS, routeChunks(SERVER_TS).find((chunk) => chunk.method === route.method && pathsOf(chunk.path).includes(route.path))?.body || '')})`);
    }

    const uniqueAllowlist = [...new Set(allowlist)].sort();
    expect(uniqueAllowlist.length).toBeGreaterThan(0);
    expect(uniqueAllowlist.every((entry) => /\/callback/.test(entry))).toBe(true);
    expect(offenders).toEqual([]);
    console.log(`OAUTH_CALLBACK_ALLOWLIST ${JSON.stringify(uniqueAllowlist)}`);
    fs.writeFileSync('/tmp/route-auth-allowlist.json', JSON.stringify(uniqueAllowlist, null, 2));
  }, 180000);
});
