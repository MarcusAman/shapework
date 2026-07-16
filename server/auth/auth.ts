/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response, NextFunction } from 'express';
import { verifyJwt } from './jwt.js';

// Define permission scopes
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  owner: [
    'view_work_queue', 'manage_work_queue', 'view_deals', 'manage_deals',
    'view_compliance', 'manage_compliance', 'approve_actions', 'manage_integrations',
    'manage_users', 'configure_routing', 'view_audit', 'export_audit', 'manage_workspace'
  ],
  admin: [
    'view_work_queue', 'manage_work_queue', 'view_deals', 'manage_deals',
    'view_compliance', 'manage_compliance', 'approve_actions', 'manage_integrations',
    'manage_users', 'configure_routing', 'view_audit', 'export_audit', 'manage_workspace',
    'access_developer_tools'
  ],
  operations_lead: [
    'view_work_queue', 'manage_work_queue', 'view_deals', 'manage_deals',
    'view_compliance', 'manage_compliance', 'approve_actions', 'configure_routing', 'view_audit', 'manage_users'
  ],
  transaction_coordinator: [
    'view_work_queue', 'manage_work_queue', 'view_deals', 'manage_deals',
    'view_compliance', 'manage_compliance'
  ],
  compliance_partner: [
    'view_work_queue', 'view_compliance', 'manage_compliance', 'view_audit'
  ],
  listing_coordinator: [
    'view_work_queue', 'view_deals', 'manage_deals'
  ],
  marketing_coordinator: [
    'view_work_queue'
  ],
  events: [
    'view_work_queue'
  ],
  maintenance: [
    'view_work_queue'
  ],
  agent_support: [
    'view_work_queue'
  ],
  agent: [
    'view_work_queue'
  ]
};

// Seed authenticatable users for production scaffold
export const SEEDED_USERS = [
  { id: 'usr_sarah', email: 'sarah.j@nestrealty.com', name: 'Sarah Jenkins', role: 'operations_lead' },
  { id: 'usr_diane', email: 'diane.ross@nestrealty.com', name: 'Diane Ross', role: 'transaction_coordinator' },
  { id: 'usr_owner', email: 'owner@nestrealty.com', name: 'Broker Owner', role: 'owner' },
  { id: 'usr_admin', email: 'admin@shapework.co', name: 'Platform Admin', role: 'admin' },
  { id: 'usr_marcus', email: 'marcus@shapework.co', name: 'Marcus', role: 'admin' },
  { id: 'usr_adam', email: 'adam@shapework.co', name: 'Adam', role: 'admin' },
  { id: 'usr_matt', email: 'matt@shapework.co', name: 'Matt', role: 'admin' },
  { id: 'usr_ann', email: 'ann@nestrealty.com', name: 'Ann Gunn', role: 'operations_lead' },
  { id: 'usr_melissa', email: 'melissa.gagliardi@nestrealty.com', name: 'Melissa Gagliardi', role: 'marketing_coordinator' },
  { id: 'usr_james', email: 'james.fort@nestrealty.com', name: 'James Fort', role: 'transaction_coordinator' },
  { id: 'usr_ryan', email: 'ryan@nestrealty.com', name: 'Ryan Crecelius', role: 'owner' },
  { id: 'usr_lindsay', email: 'lindsay@nestrealty.com', name: 'Lindsay Crecelius', role: 'events' },
  { id: 'usr_steve', email: 'steve@nestrealty.com', name: 'Steve Schram', role: 'maintenance' }
];

export const SEEDED_MEMBERSHIPS = [
  { id: 'm_sarah', userId: 'usr_sarah', workspaceId: 'nest-realty-demo', role: 'operations_lead' },
  { id: 'm_diane', userId: 'usr_diane', workspaceId: 'nest-realty-demo', role: 'transaction_coordinator' },
  { id: 'm_owner', userId: 'usr_owner', workspaceId: 'nest-realty-demo', role: 'owner' },
  { id: 'm_admin', userId: 'usr_admin', workspaceId: 'nest-realty-demo', role: 'admin' },
  { id: 'm_marcus', userId: 'usr_marcus', workspaceId: 'nest-realty-demo', role: 'admin' },
  { id: 'm_adam', userId: 'usr_adam', workspaceId: 'nest-realty-demo', role: 'admin' },
  { id: 'm_matt', userId: 'usr_matt', workspaceId: 'nest-realty-demo', role: 'admin' },
  { id: 'm_ann', userId: 'usr_ann', workspaceId: 'nest-realty-demo', role: 'operations_lead' },
  { id: 'm_melissa', userId: 'usr_melissa', workspaceId: 'nest-realty-demo', role: 'marketing_coordinator' },
  { id: 'm_james', userId: 'usr_james', workspaceId: 'nest-realty-demo', role: 'transaction_coordinator' },
  { id: 'm_ryan', userId: 'usr_ryan', workspaceId: 'nest-realty-demo', role: 'owner' },
  { id: 'm_lindsay', userId: 'usr_lindsay', workspaceId: 'nest-realty-demo', role: 'events' },
  { id: 'm_steve', userId: 'usr_steve', workspaceId: 'nest-realty-demo', role: 'maintenance' }
];

// Extend Express Request types inline
export interface AuthenticatedRequest extends Request {
  authUser?: typeof SEEDED_USERS[0];
  workspace?: { id: string; name: string };
  membership?: typeof SEEDED_MEMBERSHIPS[0] & { permissions: string[] };
}

// Database state hooks for dynamic checks
let workspaceUsersResolver: () => any[] = () => [];
export function setWorkspaceUsersResolver(resolver: () => any[]) {
  workspaceUsersResolver = resolver;
}

// Middleware: Authenticate Session Token
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const APP_MODE = process.env.APP_MODE || 'development';
  
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

  if (APP_MODE === 'production') {
    // 1. Fail closed if not configured
    if (!process.env.AUTH_PROVIDER_CONFIGURED) {
      return res.status(500).json({ error: 'Internal Error', message: 'Production auth provider is required.' });
    }

    // 2. Reject query token auth
    if (req.query.token) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Query token authentication is disabled in production.' });
    }

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Authentication is required in production.' });
    }
    
    // 4. Reject simple seeded/plaintext tokens
    if (token.startsWith('token_usr_') || token.includes('@') || !token.includes('.')) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Plaintext and seeded tokens are disabled in production.' });
    }

    // 5. Verify the token cryptographically
    const payload = verifyJwt(token);
    if (!payload || !payload.userId) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired session.' });
    }

    // 6. Lookup user details dynamically from the database users array
    const liveUsers = workspaceUsersResolver();
    const resolvedUser = liveUsers.find(u => u.id === payload.userId || u.email === payload.email);
    if (!resolvedUser) {
      return res.status(401).json({ error: 'Unauthorized', message: 'User not found or invalid session.' });
    }

    req.authUser = {
      id: resolvedUser.id,
      email: resolvedUser.email,
      name: resolvedUser.name,
      role: resolvedUser.role
    };
    return next();
  }

  // Development / Demo Mode Verification
  if (token === 'unauthenticated') {
    return res.status(401).json({ error: 'Unauthorized', message: 'Authentication is required.' });
  }

  if (token) {
    // Check if it is a JWT token in development
    const payload = verifyJwt(token);
    if (payload && payload.userId) {
      const liveUsers = workspaceUsersResolver();
      const resolvedUser = liveUsers.find(u => u.id === payload.userId || u.email === payload.email) || SEEDED_USERS.find(u => u.id === payload.userId);
      if (resolvedUser) {
        req.authUser = resolvedUser;
        return next();
      }
    }

    // Fallback to simple seeded or database-seeded tokens in development
    const liveUsers = workspaceUsersResolver();
    const resolvedUser = liveUsers.find(u => `token_${u.id}` === token || u.id === token || u.email === token)
      || SEEDED_USERS.find(u => `token_${u.id}` === token || u.id === token || u.email === token);

    if (!resolvedUser) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid token.' });
    }
    req.authUser = resolvedUser;
    return next();
  }

  // Return 401 if no active session/token in development, prompting /login routing
  return res.status(401).json({ error: 'Unauthorized', message: 'Authentication is required.' });
}

// Middleware: Resolve Active Workspace Tenant Context
export function resolveWorkspaceContext(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const APP_MODE = process.env.APP_MODE || 'development';
  
  // Do not trust query parameters in production
  let requestedWsId = APP_MODE === 'production'
    ? req.headers['x-workspace-id']
    : req.headers['x-workspace-id'] || req.query.workspaceId || 'nest-realty-demo';

  // Normalize workspace ID aliases in development/demo mode
  if (APP_MODE !== 'production') {
    if (requestedWsId === 'nest-realty-wilmington') {
      requestedWsId = 'nest-realty-demo';
    }
  }

  const user = req.authUser;
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'User context is not authenticated.' });
  }

  if (!requestedWsId) {
    return res.status(400).json({ error: 'Bad Request', message: 'Workspace ID header is required.' });
  }

  // Query live workspace user memberships dynamically
  const liveUsers = workspaceUsersResolver();
  const activeMembership = liveUsers.find(u => 
    (u.id === user.id || u.email === user.email) && u.workspaceId === requestedWsId
  );

  if (APP_MODE === 'production') {
    if (!activeMembership) {
      return res.status(403).json({ error: 'Forbidden', message: 'User is not a member of the requested workspace.' });
    }

    req.workspace = { id: requestedWsId as string, name: 'Active Brokerage Workspace' };
    req.membership = {
      id: activeMembership.id,
      userId: activeMembership.id,
      workspaceId: requestedWsId as string,
      role: activeMembership.role,
      permissions: ROLE_PERMISSIONS[activeMembership.role] || []
    };
    return next();
  }

  // Staging / Demo bypass - fallback to seeded memberships if needed
  if (!activeMembership) {
    const fallbackMembership = SEEDED_MEMBERSHIPS.find(m => m.workspaceId === requestedWsId);
    if (fallbackMembership) {
      req.workspace = { id: requestedWsId as string, name: 'Nest Realty Demo Workspace' };
      req.membership = {
        ...fallbackMembership,
        permissions: ROLE_PERMISSIONS[fallbackMembership.role] || []
      };
      return next();
    }
    if (requestedWsId && requestedWsId !== 'nest-realty-demo') {
      return res.status(403).json({ error: 'Access Denied', message: 'User is not a member of the requested workspace.' });
    }
  }

  req.workspace = { id: (activeMembership?.workspaceId || 'nest-realty-demo') as string, name: 'Workspace Console' };
  req.membership = {
    id: activeMembership?.id || 'm_sarah',
    userId: activeMembership?.id || 'usr_sarah',
    workspaceId: (activeMembership?.workspaceId || 'nest-realty-demo') as string,
    role: activeMembership?.role || 'operations_lead',
    permissions: ROLE_PERMISSIONS[activeMembership?.role || 'operations_lead'] || []
  };
  next();
}

// Middleware: Require Workspace Membership
export function requireWorkspaceMembership(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.workspace || !req.membership || req.workspace.id !== req.membership.workspaceId) {
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

    const hasPermission = membership.permissions.includes(permission) || membership.role === 'admin';
    if (!hasPermission) {
      console.warn(`[Permission Denied] User: ${req.authUser?.email}, Role: ${membership.role}, Required: ${permission}, Permissions: ${membership.permissions.join(',')}`);
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
  const allowedEmails = ['marcus@shapework.co', 'matt@shapework.co', 'adam@shapework.co'];
  const allowedIds = ['usr_marcus', 'usr_matt', 'usr_adam'];
  if (!req.authUser || (!allowedEmails.includes(req.authUser.email) && !allowedIds.includes(req.authUser.id))) {
    return res.status(403).json({ error: 'Forbidden', message: 'Restricted to shapework administrative and engineering staff.' });
  }
  next();
}
