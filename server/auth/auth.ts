/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response, NextFunction } from 'express';
import { verifyJwt } from './jwt.js';

// Canonical Workspace Identifier for Nest Realty Wilmington Pilot
export const CANONICAL_WILMINGTON_WORKSPACE_ID = 'ws_wilmington';
export const WILMINGTON_WORKSPACE_ALIASES = ['nest-realty-wilmington', 'nest-realty-demo'];

// Define marketing explicit capabilities
export const MARKETING_CAPABILITIES = [
  'marketing.campaign.read_own',
  'marketing.campaign.read_all',
  'marketing.campaign.create',
  'marketing.campaign.edit_own',
  'marketing.campaign.edit_all',
  'marketing.campaign.generate',
  'marketing.campaign.request_review',
  'marketing.campaign.review',
  'marketing.campaign.approve',
  'marketing.campaign.export',
  'marketing.campaign.deliver',
  'marketing.workboard.read',
  'marketing.intake.read',
  'marketing.templates.read',
  'marketing.templates.manage',
  'marketing.advanced_editor.use',
  'marketing.ask',
  'marketing.connections.manage',
  // Destination-Specific Delivery Permissions
  'marketing.delivery.download',
  'marketing.delivery.google_drive',
  'marketing.delivery.crm',
  'marketing.delivery.mls',
  'marketing.delivery.email',
  'marketing.delivery.print'
];

// Define permission scopes
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  owner: [
    'view_work_queue', 'manage_work_queue', 'view_deals', 'manage_deals',
    'view_compliance', 'manage_compliance', 'approve_actions', 'manage_integrations',
    'manage_users', 'configure_routing', 'view_audit', 'export_audit', 'manage_workspace',
    'directory.read', 'directory.manage', 'directory.sync',
    'org_chart.read', 'org_chart.write', 'org_chart.delete', 'org_chart.audit.read',
    'sops.read', 'sops.write', 'sops.delete',
    'owner_digest.read', 'owner_digest.configure', 'owner_digest.send_test',
    'ai.use', 'ai.generate_sop', 'ai.review_sop', 'ai.analyze_knowledge', 'ai.answer_from_knowledge', 'ai.manage_prompts',
    'contract_authoring',
    // Explicit Marketing Capabilities for Owner
    'marketing.campaign.read_all', 'marketing.campaign.read_own', 'marketing.campaign.edit_own',
    'marketing.campaign.approve', 'marketing.campaign.export', 'marketing.campaign.deliver', 'marketing.ask'
  ],
  admin: [
    'view_work_queue', 'manage_work_queue', 'view_deals', 'manage_deals',
    'view_compliance', 'manage_compliance', 'approve_actions', 'manage_integrations',
    'manage_users', 'configure_routing', 'view_audit', 'export_audit', 'manage_workspace',
    'access_developer_tools', 'directory.read', 'directory.manage', 'directory.sync',
    'org_chart.read', 'org_chart.write', 'org_chart.delete', 'org_chart.audit.read',
    'sops.read', 'sops.write', 'sops.delete',
    'owner_digest.read', 'owner_digest.configure', 'owner_digest.send_test',
    'ai.use', 'ai.generate_sop', 'ai.review_sop', 'ai.analyze_knowledge', 'ai.answer_from_knowledge', 'ai.manage_prompts',
    'contract_authoring',
    // All Marketing Capabilities
    ...MARKETING_CAPABILITIES
  ],
  bic: [
    'view_work_queue', 'manage_work_queue', 'view_deals', 'manage_deals',
    'view_compliance', 'manage_compliance', 'approve_actions', 'configure_routing', 'view_audit',
    'org_chart.read', 'org_chart.write', 'org_chart.audit.read',
    'sops.read', 'sops.write', 'sops.delete',
    'owner_digest.read',
    'contract_authoring', 'contract_bic_review',
    'directory.read', 'ai.use', 'ai.review_sop', 'ai.analyze_knowledge', 'ai.answer_from_knowledge'
  ],
  operations_lead: [
    'view_work_queue', 'manage_work_queue', 'view_deals', 'manage_deals',
    'view_compliance', 'manage_compliance', 'approve_actions', 'configure_routing', 'view_audit', 'manage_users',
    'directory.read', 'directory.manage', 'directory.sync',
    'org_chart.read', 'org_chart.write', 'org_chart.audit.read',
    'sops.read', 'sops.write', 'sops.delete',
    'owner_digest.read',
    'contract_authoring',
    'ai.use', 'ai.generate_sop', 'ai.review_sop', 'ai.analyze_knowledge', 'ai.answer_from_knowledge', 'ai.manage_prompts',
    ...MARKETING_CAPABILITIES
  ],
  marketing_coordinator: [
    'view_work_queue', 'view_deals', 'manage_deals',
    'directory.read', 'org_chart.read', 'sops.read', 'sops.write',
    ...MARKETING_CAPABILITIES
  ],
  transaction_coordinator: [
    'view_work_queue', 'manage_work_queue', 'view_deals', 'manage_deals',
    'view_compliance', 'manage_compliance', 'directory.read', 'org_chart.read', 'sops.read',
    'ai.use', 'ai.review_sop', 'ai.analyze_knowledge', 'ai.answer_from_knowledge',
    'contract_authoring',
    'marketing.campaign.read_own', 'marketing.campaign.create', 'marketing.campaign.edit_own', 'marketing.campaign.export', 'marketing.campaign.deliver', 'marketing.ask'
  ],
  compliance_partner: [
    'view_work_queue', 'view_compliance', 'manage_compliance', 'view_audit',
    'directory.read', 'org_chart.read', 'sops.read',
    'contract_authoring', 'contract_bic_review',
    'ai.use', 'ai.review_sop', 'ai.analyze_knowledge', 'ai.answer_from_knowledge',
    'marketing.campaign.read_all', 'marketing.ask'
  ],
  listing_coordinator: [
    'view_work_queue', 'view_deals', 'manage_deals',
    'directory.read', 'org_chart.read', 'sops.read',
    'marketing.campaign.read_own', 'marketing.campaign.create', 'marketing.campaign.edit_own', 'marketing.campaign.export', 'marketing.campaign.deliver', 'marketing.ask'
  ],
  events: [
    'view_work_queue', 'directory.read', 'org_chart.read', 'sops.read'
  ],
  maintenance: [
    'view_work_queue', 'directory.read', 'org_chart.read', 'sops.read'
  ],
  agent_support: [
    'view_work_queue', 'directory.read', 'org_chart.read', 'sops.read'
  ],
  agent: [
    'view_work_queue', 'directory.read', 'org_chart.read', 'sops.read',
    'ai.use', 'ai.answer_from_knowledge',
    'contract_authoring',
    'marketing.campaign.read_own', 'marketing.campaign.create', 'marketing.campaign.edit_own', 'marketing.campaign.generate', 'marketing.campaign.request_review', 'marketing.campaign.export', 'marketing.campaign.deliver', 'marketing.ask'
  ]
};

// Seed authenticatable users for development / fallback scaffold
export const SEEDED_USERS = [
  { id: 'usr_sarah', email: 'sarah.j@nestrealty.com', name: 'Sarah Jenkins', role: 'operations_lead' },
  { id: 'usr_diane', email: 'diane.ross@nestrealty.com', name: 'Diane Ross', role: 'transaction_coordinator' },
  { id: 'usr_owner', email: 'owner@nestrealty.com', name: 'Broker Owner', role: 'owner' },
  { id: 'usr_admin', email: 'admin@shapework.invalid', name: 'Platform Admin', role: 'admin' },
  { id: 'usr_marcus', email: 'marcus@shapework.invalid', name: 'Marcus', role: 'admin' },
  { id: 'usr_adam', email: 'adam@shapework.invalid', name: 'Adam', role: 'admin' },
  { id: 'usr_matt', email: 'matt@shapework.invalid', name: 'Matt', role: 'admin' },
  { id: 'usr_ann', email: 'ann@nestrealty.com', name: 'Ann Gunn', role: 'operations_lead' },
  { id: 'usr_melissa', email: 'melissa.gagliardi@nestrealty.com', name: 'Melissa Gagliardi', role: 'marketing_coordinator' },
  { id: 'usr_james', email: 'james.fort@nestrealty.com', name: 'James Fort', role: 'transaction_coordinator' },
  { id: 'usr_ryan', email: 'ryan@nestrealty.com', name: 'Ryan Crecelius', role: 'owner' },
  { id: 'usr_lindsay', email: 'lindsay@nestrealty.com', name: 'Lindsay Crecelius', role: 'events' },
  { id: 'usr_steve', email: 'steve@nestrealty.com', name: 'Steve Schram', role: 'maintenance' }
];

export const SEEDED_MEMBERSHIPS = [
  { id: 'm_sarah', userId: 'usr_sarah', workspaceId: 'ws_wilmington', role: 'operations_lead' },
  { id: 'm_diane', userId: 'usr_diane', workspaceId: 'ws_wilmington', role: 'transaction_coordinator' },
  { id: 'm_owner', userId: 'usr_owner', workspaceId: 'ws_wilmington', role: 'owner' },
  { id: 'm_admin', userId: 'usr_admin', workspaceId: 'ws_wilmington', role: 'admin' },
  { id: 'm_marcus', userId: 'usr_marcus', workspaceId: 'ws_wilmington', role: 'admin' },
  { id: 'm_adam', userId: 'usr_adam', workspaceId: 'ws_wilmington', role: 'admin' },
  { id: 'm_matt', userId: 'usr_matt', workspaceId: 'ws_wilmington', role: 'admin' },
  { id: 'm_ann', userId: 'usr_ann', workspaceId: 'ws_wilmington', role: 'operations_lead' },
  { id: 'm_melissa', userId: 'usr_melissa', workspaceId: 'ws_wilmington', role: 'marketing_coordinator' },
  { id: 'm_james', userId: 'usr_james', workspaceId: 'ws_wilmington', role: 'transaction_coordinator' },
  { id: 'm_ryan', userId: 'usr_ryan', workspaceId: 'ws_wilmington', role: 'owner' },
  { id: 'm_lindsay', userId: 'usr_lindsay', workspaceId: 'ws_wilmington', role: 'events' },
  { id: 'm_steve', userId: 'usr_steve', workspaceId: 'ws_wilmington', role: 'maintenance' }
];

// Extend Express Request types inline
export interface AuthenticatedRequest extends Request {
  authUser?: typeof SEEDED_USERS[0] & { status?: string; securityVersion?: number };
  workspace?: { id: string; name: string };
  membership?: typeof SEEDED_MEMBERSHIPS[0] & { permissions: string[]; hasValidMembership: boolean };
}

// Database state hooks for dynamic checks
let workspaceUsersResolver: () => any[] = () => [];
export function setWorkspaceUsersResolver(resolver: () => any[]) {
  workspaceUsersResolver = resolver;
}

// Cookie Management Helpers
export function setSecureAuthCookie(res: Response, token: string) {
  const isSecure = process.env.NODE_ENV === 'production' || process.env.APP_ENV === 'uat' || process.env.COOKIE_SECURE === 'true';
  res.cookie('shapework_session', token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'strict',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie('shapework_session', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/'
  });
}

// CSRF Defense Middleware for Mutation Requests
export function requireCsrfProtection(req: Request, res: Response, next: NextFunction) {
  const mutationMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
  if (!mutationMethods.includes(req.method)) {
    return next();
  }

  // Exempt public authentication intake routes
  const exemptPaths = [
    '/api/auth/login',
    '/api/auth/activate',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/discovery/inquire'
  ];

  if (exemptPaths.some(p => req.path.startsWith(p))) {
    return next();
  }

  // 1. Bearer Token requests in Authorization header are immune to browser cross-site ambient credential CSRF
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return next();
  }

  // 2. Custom header verification for SPA / cookie-based requests
  const csrfHeader = req.headers['x-shapework-csrf'] || req.headers['x-requested-with'];
  if (csrfHeader) {
    return next();
  }

  // 3. Origin / Referer verification
  const origin = req.headers['origin'] || req.headers['referer'];
  if (origin && typeof origin === 'string') {
    const allowedHosts = [
      'canary---shapework-os-3xc3npf56a-uc.a.run.app',
      'shapework-os-45783991821.us-central1.run.app',
      'localhost',
      '127.0.0.1'
    ];
    const isAllowed = allowedHosts.some(h => origin.includes(h));
    if (isAllowed) {
      return next();
    }
  }

  // In test or local dev mode with no browser cookies, allow pass-through if explicitly marked
  if (process.env.NODE_ENV === 'test' && !req.headers.cookie) {
    return next();
  }

  return res.status(403).json({
    error: 'csrf_protection_failed',
    message: 'CSRF defense triggered: custom header (x-shapework-csrf) or valid Origin required for state mutation.'
  });
}

// Middleware: Authenticate Session Token
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const APP_MODE = process.env.APP_MODE || process.env.APP_ENV || 'development';
  
  // 1. Extract token from Cookie, Bearer header, or query parameters
  let token = '';
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const match = cookieHeader.match(/shapework_session=([^;]+)/);
    if (match) token = match[1];
  }

  const authHeader = req.headers['authorization'];
  if (!token && authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token && req.query.token) {
    token = String(req.query.token);
  }
  if ((APP_MODE === 'production' || APP_MODE === 'uat') && process.env.AUTH_PROVIDER_CONFIGURED === 'true') {
    // Reject query token auth in production/UAT
    if (req.query.token) {
      return res.status(401).json({ error: 'authentication_required', message: 'Query token authentication is disabled in production.' });
    }
  }

  if (!token || token === 'unauthenticated' || token === 'logout') {
    return res.status(401).json({ error: 'authentication_required', message: 'Authentication is required.' });
  }
    
  // Check if valid JWT
  const payload = verifyJwt(token);
  if (payload && (payload.userId || payload.id || payload.email)) {
    const uId = payload.userId || payload.id || `usr_${(payload.email || 'user').split('@')[0]}`;
    const uEmail = payload.email || `${uId}@nestrealty.com`;

    // In database mode, verify user status and security_version directly against DB
    const { dbPool } = await import('../persistence/repositories.js');
    if (dbPool) {
      try {
        const dbUserRes = await dbPool.query(
          'SELECT id, email, name, status, security_version, locked_until FROM users WHERE id = $1 OR email = $2',
          [uId, uEmail]
        );
        if (dbUserRes.rows.length === 0) {
          return res.status(401).json({ error: 'authentication_required', message: 'User account not found.' });
        }
        const dbUser = dbUserRes.rows[0];

        // Check if user is locked or disabled
        if (dbUser.status === 'disabled') {
          return res.status(403).json({ error: 'account_disabled', message: 'This user account has been disabled.' });
        }
        if (dbUser.status === 'pending_activation') {
          return res.status(401).json({ error: 'activation_required', message: 'Account must be activated before login.' });
        }
        if (dbUser.locked_until && new Date(dbUser.locked_until) > new Date()) {
          return res.status(403).json({ error: 'account_locked', message: 'Account is temporarily locked. Please try again later.' });
        }

        // Check security version (session revocation on password reset or incident containment)
        const tokenSecVer = payload.securityVersion !== undefined ? payload.securityVersion : 1;
        if (dbUser.security_version > tokenSecVer) {
          return res.status(401).json({ error: 'session_revoked', message: 'Session has been revoked. Please log in again.' });
        }

        req.authUser = {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          role: payload.role || 'member',
          workspaceId: payload.workspaceId || CANONICAL_WILMINGTON_WORKSPACE_ID,
          status: dbUser.status,
          securityVersion: dbUser.security_version
        };
        (req as any).user = req.authUser;
        return next();
      } catch (err) {
        console.error('[Auth Middleware] Database auth check error:', err);
      }
    }

    const liveUsers = workspaceUsersResolver();
    const resolvedUser = liveUsers.find(u => u.id === uId || u.email === uEmail) || SEEDED_USERS.find(u => u.id === uId || u.email === uEmail);

    if (resolvedUser) {
      req.authUser = {
        ...resolvedUser,
        role: payload.role || resolvedUser.role,
        workspaceId: payload.workspaceId || (resolvedUser as any).workspaceId || CANONICAL_WILMINGTON_WORKSPACE_ID
      };
    } else {
      req.authUser = {
        id: uId,
        email: uEmail,
        name: payload.name || uEmail.split('@')[0],
        role: payload.role || 'owner',
        workspaceId: payload.workspaceId || CANONICAL_WILMINGTON_WORKSPACE_ID
      };
    }
    (req as any).user = req.authUser;
    return next();
  }

  // Fallback to simple seeded or database-seeded email/tokens
  const liveUsers = workspaceUsersResolver();
  const resolvedUser = liveUsers.find(u => `token_${u.id}` === token || u.id === token || u.email === token)
    || SEEDED_USERS.find(u => `token_${u.id}` === token || u.id === token || u.email === token);

  if (resolvedUser) {
    req.authUser = resolvedUser;
    (req as any).user = resolvedUser;
    return next();
  }

  return res.status(401).json({ error: 'authentication_required', message: 'Invalid or expired session.' });
}

// Middleware: Resolve Active Workspace Tenant Context with Strict Cross-Tenant Isolation
export async function resolveWorkspaceContext(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.authUser) {
    return res.status(401).json({ error: 'authentication_required', message: 'Authentication is required.' });
  }

  let requestedWsId = (req.headers['x-workspace-id'] as string) || (req.query.workspaceId as string);

  const user = req.authUser;
  const userWsId = (user as any).workspaceId;
  if (!requestedWsId) {
    requestedWsId = userWsId || CANONICAL_WILMINGTON_WORKSPACE_ID;
  }

  // Seamlessly resolve legacy aliases to canonical Wilmington workspace identifier
  if (WILMINGTON_WORKSPACE_ALIASES.includes(requestedWsId)) {
    requestedWsId = CANONICAL_WILMINGTON_WORKSPACE_ID;
  }

  // In database mode, verify membership strictly via workspace_memberships table
  const { dbPool } = await import('../persistence/repositories.js');
  if (dbPool) {
    try {
      const memRes = await dbPool.query(
        'SELECT id, workspace_id, user_id, role, permissions FROM workspace_memberships WHERE workspace_id = $1 AND user_id = $2',
        [requestedWsId, user.id]
      );

      // Strict tenant fence: Reject any cross-workspace request if user has no membership in requestedWsId
      if (memRes.rows.length === 0) {
        return res.status(403).json({ error: 'Forbidden', message: 'User is not a member of the requested workspace.' });
      }

      const membershipRow = memRes.rows[0];
      const memberRole = membershipRow?.role || user.role || 'member';
      const basePermissions = ROLE_PERMISSIONS[memberRole] || ROLE_PERMISSIONS.owner || [];
      const permissions = membershipRow?.permissions || [...basePermissions, 'directory.read', 'directory.manage', 'directory.sync'];

      req.workspace = { id: requestedWsId, name: 'Active Brokerage Workspace' };
      req.membership = {
        id: membershipRow?.id || `mem_${user.id}_${requestedWsId}`,
        userId: user.id,
        workspaceId: requestedWsId,
        role: memberRole,
        permissions,
        hasValidMembership: true
      } as any;
      return next();
    } catch (err) {
      console.error('[Auth Middleware] Workspace membership check error:', err);
    }
  }

  // Query live workspace user memberships dynamically
  const liveUsers = workspaceUsersResolver();
  const activeMembership = liveUsers.find(u => 
    (u.id === user.id || u.email === user.email) && u.workspaceId === requestedWsId
  ) || SEEDED_MEMBERSHIPS.find(m => (m.userId === user.id || m.id === `m_${user.id.replace('usr_', '')}`) && m.workspaceId === requestedWsId);

  // Strict tenant fence check: User must be an explicit member of the target workspace
  const isMember = Boolean(activeMembership && activeMembership.workspaceId === requestedWsId) || (userWsId === requestedWsId);

  if (!isMember) {
    return res.status(403).json({ error: 'Forbidden', message: 'User is not a member of the requested workspace.' });
  }

  const memberRole = activeMembership?.role || user.role || 'owner';
  const basePermissions = ROLE_PERMISSIONS[memberRole] || ROLE_PERMISSIONS.owner || [];
  const permissions = [...basePermissions, 'directory.read', 'directory.manage', 'directory.sync'];

  req.workspace = { id: requestedWsId, name: 'Active Brokerage Workspace' };
  req.membership = {
    id: activeMembership?.id || `m_${user.id}`,
    userId: user.id,
    workspaceId: requestedWsId,
    role: memberRole,
    permissions,
    hasValidMembership: isMember
  } as any;
  return next();
}

// Middleware: Require Workspace Membership
export function requireWorkspaceMembership(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const membership = req.membership as any;
  if (!req.workspace || !membership || !membership.hasValidMembership || req.workspace.id !== membership.workspaceId) {
    return res.status(403).json({ error: 'Forbidden', message: 'Workspace membership is required.' });
  }
  next();
}

// Middleware: Check Role Permissions (RBAC)
export function requirePermission(permission: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const membership = req.membership;
    if (!membership) {
      console.warn(`[Permission Denied] No membership found for user: ${req.authUser?.email}`);
      return res.status(403).json({ error: 'Forbidden', message: 'Workspace membership permissions not found.' });
    }

    const hasPermission = membership.permissions.includes(permission) || membership.role === 'admin' || membership.role === 'owner';
    if (!hasPermission) {
      console.warn(`[Permission Denied] User: ${req.authUser?.email}, Role: ${membership.role}, Required: ${permission}, Permissions: ${membership.permissions.join(',')}`);
      if (permission.startsWith('directory')) {
        return res.status(403).json({
          error: 'directory_access_denied',
          message: `Insufficient permissions. Required scope: "${permission}".`
        });
      }
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: `Insufficient permissions. Required scope: "${permission}".` 
      });
    }
    next();
  };
}

// Middleware: Require Shapework Internal Operator/Developer roles
export function requireInternal(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const allowedEmails = ['marcus@shapework.invalid', 'matt@shapework.invalid', 'adam@shapework.invalid'];
  const allowedIds = ['usr_marcus', 'usr_matt', 'usr_adam'];
  if (!req.authUser || (!allowedEmails.includes(req.authUser.email) && !allowedIds.includes(req.authUser.id))) {
    return res.status(403).json({ error: 'Forbidden', message: 'Restricted to shapework administrative and engineering staff.' });
  }
  next();
}
