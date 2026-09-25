/**
 * Default-deny session gate for every /api route.
 * Mount once, before /api routers and inline handlers.
 * Non-allowlisted routes with no valid session end here; handler bodies do not run.
 */
import type { Express, NextFunction, Request, Response } from 'express';
import { requireAuth, type AuthenticatedRequest } from './auth.js';

export type PublicApiRoute = { method: string; path: string };

/**
 * Exact method + path pattern. Adding a public route means editing this list
 * and the harness that pins it.
 *
 * OAuth callbacks are the nine dangerous callback routes discovered by
 * server/routeAuthClosure.harness.test.ts. Their own state and session checks
 * still run after this gate.
 */
export const PUBLIC_API_ROUTES: PublicApiRoute[] = [
  { method: 'POST', path: '/api/auth/login' },
  { method: 'POST', path: '/api/auth/activate' },
  { method: 'POST', path: '/api/workspaces/activate' },
  { method: 'POST', path: '/api/auth/forgot-password' },
  { method: 'POST', path: '/api/auth/reset-password' },
  { method: 'POST', path: '/api/auth/logout' },
  { method: 'GET', path: '/api/health' },
  { method: 'GET', path: '/api/version' },
  { method: 'GET', path: '/api/integrations/google/callback' },
  { method: 'GET', path: '/api/integrations/microsoft/callback' },
  { method: 'GET', path: '/api/integrations/basecamp/callback' },
  { method: 'GET', path: '/api/integrations/quickbooks/callback' },
  { method: 'GET', path: '/api/integrations/rechat/oauth/callback' },
  { method: 'GET', path: '/api/integrations/slack/callback' },
  { method: 'GET', path: '/api/integrations/canva/callback' },
  { method: 'GET', path: '/api/auth/:provider/callback' },
  { method: 'GET', path: '/api/integrations/:provider/callback' },
  { method: 'POST', path: '/api/retell/webhook' },
  { method: 'POST', path: '/api/retell/nest-ops/call-analysis-webhook' },
  { method: 'POST', path: '/api/retell/call-ended' },
  { method: 'POST', path: '/api/retell/nest-ops/inbound-webhook' },
  { method: 'POST', path: '/api/retell/nest-ops/inbound-sms-webhook' },
  { method: 'POST', path: '/api/vendors/webhook/:vendorId' },
  { method: 'POST', path: '/api/contracts/esign/webhook' },
  { method: 'POST', path: '/api/webhooks/resend' },
  { method: 'POST', path: '/api/webhooks/zapier/:workspaceId/:secret' },
  { method: 'POST', path: '/api/internal/jobs/evaluate-task-slas' },
  { method: 'GET', path: '/api/mode' },
  { method: 'GET', path: '/api/auth/invitations/validate' },
  { method: 'GET', path: '/api/sops/authoring-requests/by-token/:invitationToken' },
  { method: 'POST', path: '/api/sops/authoring-requests/:id/submit' },
  { method: 'POST', path: '/api/public/discovery-request' },
  { method: 'GET', path: '/api/public/surveys/:slug' },
  { method: 'POST', path: '/api/public/surveys/:slug/submit' },
  { method: 'POST', path: '/api/public/assessments' },
  { method: 'GET', path: '/api/comps/share/:token' },
  { method: 'GET', path: '/api/tracker/:token' },
  { method: 'GET', path: '/api/track/marketing/:token' },
  { method: 'POST', path: '/api/tracker/:token/notes' },
  { method: 'POST', path: '/api/track/marketing/:token/notes' },
  { method: 'POST', path: '/api/tracker/:token/assets' },
  { method: 'POST', path: '/api/track/marketing/:token/assets' },
  { method: 'POST', path: '/api/tracker/:token/callback' },
  { method: 'GET', path: '/api/marketing/proof-portal/:token' },
  { method: 'POST', path: '/api/marketing/proof-portal/:token/action' },
];

type StackLayer = {
  route?: {
    path: string | string[];
    methods: Record<string, boolean>;
    stack?: Array<{ handle: (...args: unknown[]) => unknown }>;
  };
  handle?: { stack?: StackLayer[] };
  regexp?: { fast_slash?: boolean; source: string };
  keys?: Array<{ name: string }>;
  match?: (path: string) => boolean;
  path?: string;
};

function stripQuery(path: string): string {
  const bare = path.split('?')[0];
  return bare.length > 1 && bare.endsWith('/') ? bare.slice(0, -1) : bare;
}

function patternToRegExp(pattern: string): RegExp {
  const body = pattern.split('/').map((segment) => {
    if (!segment) return '';
    if (segment.startsWith(':')) return '[^/]+';
    return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }).join('/');
  return new RegExp(`^${body}/?$`, 'i');
}

const publicMatchers = PUBLIC_API_ROUTES.map((route) => ({
  method: route.method.toUpperCase(),
  test: patternToRegExp(route.path),
}));

export function isPublicApiRoute(method: string, path: string): boolean {
  const normalized = stripQuery(path);
  const verb = method.toUpperCase();
  return publicMatchers.some((entry) => entry.method === verb && entry.test.test(normalized));
}

function mountPattern(layer: StackLayer): string {
  if (layer.regexp?.fast_slash) return '';
  const source = layer.regexp?.source || '';
  let src = source.replace(/^\^/, '');
  src = src.replace(/\\\/\?\(\?=\\\/\|\$\)$/i, '');
  src = src.replace(/\\\/\?$/i, '');
  src = src.replace(/\$$/i, '');
  src = src.replace(/\\\//g, '/');
  const keys = layer.keys || [];
  let keyIndex = 0;
  src = src.replace(/\(\?:\(\[\^\/\]\+\?\)\)/g, () => `:${keys[keyIndex++]?.name || 'param'}`);
  if (!src.startsWith('/')) src = `/${src}`;
  if (src.length > 1 && src.endsWith('/')) src = src.slice(0, -1);
  return src === '/' ? '' : src;
}

function joinPath(mount: string, routePath: string): string {
  if (!routePath || routePath === '/') return mount || '/';
  if (!mount || mount === '/') return routePath.startsWith('/') ? routePath : `/${routePath}`;
  const base = mount.endsWith('/') ? mount.slice(0, -1) : mount;
  return `${base}${routePath.startsWith('/') ? routePath : `/${routePath}`}`;
}

function walk(stack: StackLayer[], mount: string, out: PublicApiRoute[]) {
  for (const layer of stack) {
    if (layer.route) {
      const paths = Array.isArray(layer.route.path) ? layer.route.path : [layer.route.path];
      for (const routePath of paths) {
        if (typeof routePath !== 'string') continue;
        const full = joinPath(mount, routePath);
        if (!full.startsWith('/api')) continue;
        for (const [method, enabled] of Object.entries(layer.route.methods || {})) {
          if (!enabled || method === '_all') continue;
          out.push({ method: method.toUpperCase(), path: full });
        }
      }
      continue;
    }
    const child = layer.handle?.stack;
    if (child) {
      walk(child, joinPath(mount, mountPattern(layer)), out);
    }
  }
}

export function registeredApiRoutes(app: Express): PublicApiRoute[] {
  const stack = ((app as unknown as { _router?: { stack?: StackLayer[] } })._router?.stack) || [];
  const out: PublicApiRoute[] = [];
  walk(stack, '', out);
  return out;
}

function routeIsApiScoped(mount: string, routePath: string | string[]): boolean {
  const paths = Array.isArray(routePath) ? routePath : [routePath];
  return paths.some((entry) => {
    if (typeof entry !== 'string') return false;
    const full = joinPath(mount, entry);
    return full === '/api' || full.startsWith('/api/');
  });
}

function routeMatches(stack: StackLayer[], method: string, path: string, mount = ''): boolean {
  const verb = method.toLowerCase();
  for (const layer of stack) {
    if (layer.route && !routeIsApiScoped(mount, layer.route.path)) continue;
    if (!layer.match?.(path)) continue;
    if (layer.route) {
      const methods = layer.route.methods || {};
      if (methods[verb] || methods._all) return true;
      continue;
    }
    const child = layer.handle?.stack;
    if (!child) continue;
    const matched = layer.path || '';
    let rest = path;
    if (layer.regexp?.fast_slash) {
      rest = path || '/';
    } else if (matched && (path === matched || path.startsWith(`${matched}/`) || path.startsWith(matched))) {
      rest = path.slice(matched.length) || '/';
    }
    if (!rest.startsWith('/')) rest = `/${rest}`;
    if (routeMatches(child, method, rest, joinPath(mount, mountPattern(layer)))) return true;
  }
  return false;
}

function requestMatchesRegisteredRoute(app: Express, method: string, path: string): boolean {
  const stack = ((app as unknown as { _router?: { stack?: StackLayer[] } })._router?.stack) || [];
  return routeMatches(stack, method, stripQuery(path));
}

export function defaultDenyApi(req: Request, res: Response, next: NextFunction) {
  const path = stripQuery(req.path || '');
  if (!path.startsWith('/api')) return next();

  const method = req.method.toUpperCase();
  // Express dispatches HEAD to a GET route when HEAD is not registered itself.
  const methods = method === 'HEAD' ? ['HEAD', 'GET'] : [method];
  const matched = methods.some((candidate) => requestMatchesRegisteredRoute(req.app, candidate, path));
  if (!matched) return next();
  if (methods.some((candidate) => isPublicApiRoute(candidate, path))) return next();

  return requireAuth(req as AuthenticatedRequest, res, next);
}
