/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response, NextFunction } from 'express';
import { verifyJwt } from './jwt.js';

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
    'directory.read', 'ai.use', 'ai.generate_sop', 'ai.review_sop', 'ai.analyze_knowledge', 'ai.answer_from_knowledge', 'ai.manage_prompts',
    // Explicit Marketing Capabilities for Owner
    'marketing.campaign.read_all', 'marketing.campaign.read_own', 'marketing.campaign.edit_own',
    'marketing.campaign.approve', 'marketing.campaign.export', 'marketing.campaign.deliver', 'marketing.ask'
  ],
  admin: [
    'view_work_queue', 'manage_work_queue', 'view_deals', 'manage_deals',
    'view_compliance', 'manage_compliance', 'approve_actions', 'manage_integrations',
    'manage_users', 'configure_routing', 'view_audit', 'export_audit', 'manage_workspace',
    'access_developer_tools', 'directory.read', 'directory.manage', 'directory.sync',
    'ai.use', 'ai.generate_sop', 'ai.review_sop', 'ai.analyze_knowledge', 'ai.answer_from_knowledge', 'ai.manage_prompts',
    // All Marketing Capabilities
    ...MARKETING_CAPABILITIES
  ],
  operations_lead: [
    'view_work_queue', 'manage_work_queue', 'view_deals', 'manage_deals',
    'view_compliance', 'manage_compliance', 'approve_actions', 'configure_routing', 'view_audit', 'manage_users',
    'directory.read', 'directory.manage', 'directory.sync',
    'ai.use', 'ai.generate_sop', 'ai.review_sop', 'ai.analyze_knowledge', 'ai.answer_from_knowledge', 'ai.manage_prompts',
    ...MARKETING_CAPABILITIES
  ],
  marketing_coordinator: [
    'view_work_queue', 'view_deals', 'manage_deals',
    ...MARKETING_CAPABILITIES
  ],
  transaction_coordinator: [
    'view_work_queue', 'manage_work_queue', 'view_deals', 'manage_deals',
    'view_compliance', 'manage_compliance', 'ai.use', 'ai.review_sop', 'ai.analyze_knowledge', 'ai.answer_from_knowledge',
    'marketing.campaign.read_own', 'marketing.campaign.create', 'marketing.campaign.edit_own', 'marketing.campaign.export', 'marketing.campaign.deliver', 'marketing.ask'
  ],
  compliance_partner: [
    'view_work_queue', 'view_compliance', 'manage_compliance', 'view_audit',
    'ai.use', 'ai.review_sop', 'ai.analyze_knowledge', 'ai.answer_from_knowledge',
    'marketing.campaign.read_all', 'marketing.ask'
  ],
  listing_coordinator: [
    'view_work_queue', 'view_deals', 'manage_deals',
    'marketing.campaign.read_own', 'marketing.campaign.create', 'marketing.campaign.edit_own', 'marketing.campaign.export', 'marketing.campaign.deliver', 'marketing.ask'
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
    'view_work_queue', 'ai.use', 'ai.answer_from_knowledge',
    'marketing.campaign.read_own', 'marketing.campaign.create', 'marketing.campaign.edit_own', 'marketing.campaign.generate', 'marketing.campaign.request_review', 'marketing.campaign.export', 'marketing.campaign.deliver', 'marketing.ask'
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
  if (APP_MODE === 'production' && process.env.AUTH_PROVIDER_CONFIGURED === 'true') {
    // 2. Reject query token auth
    if (req.query.token) {
      return res.status(401).json({ error: 'authentication_required', message: 'Query token authentication is disabled in production.' });
    }

    if (!token) {
      return res.status(401).json({ error: 'authentication_required', message: 'Authentication is required in production.' });
    }
    
    // Check if valid JWT
    const payload = verifyJwt(token);
    if (payload && payload.userId) {
      const liveUsers = workspaceUsersResolver();
      const resolvedUser = liveUsers.find(u => u.id === payload.userId || u.email === payload.email) || SEEDED_USERS.find(u => u.id === payload.userId || u.email === payload.email);
      if (resolvedUser) {
        req.authUser = {
          id: resolvedUser.id,
          email: resolvedUser.email,
          name: resolvedUser.name,
          role: resolvedUser.role,
          workspaceId: resolvedUser.workspaceId
        };
        return next();
      }
    }
  }

  if (!token || token === 'unauthenticated' || token === 'logout') {
    if (APP_MODE !== 'production') {
      req.authUser = SEEDED_USERS.find(u => u.id === 'usr_ryan') || SEEDED_USERS[0];
      return next();
    }
    return res.status(401).json({ error: 'authentication_required', message: 'Authentication is required.' });
  }

  // Verify JWT or Seeded User Session Token
  const payload = verifyJwt(token);
  if (payload && payload.userId) {
    const liveUsers = workspaceUsersResolver();
    const resolvedUser = liveUsers.find(u => u.id === payload.userId || u.email === payload.email) || SEEDED_USERS.find(u => u.id === payload.userId || u.email === payload.email);
    if (resolvedUser) {
      req.authUser = {
        ...resolvedUser,
        workspaceId: (resolvedUser as any).workspaceId || payload.workspaceId
      };
      return next();
    }
  }

  // Fallback to simple seeded or database-seeded email/tokens
  const liveUsers = workspaceUsersResolver();
  const resolvedUser = liveUsers.find(u => `token_${u.id}` === token || u.id === token || u.email === token)
    || SEEDED_USERS.find(u => `token_${u.id}` === token || u.id === token || u.email === token);

  if (resolvedUser) {
    req.authUser = resolvedUser;
    return next();
  }

  return res.status(401).json({ error: 'authentication_required', message: 'Invalid or expired session.' });
}

// Middleware: Resolve Active Workspace Tenant Context
export function resolveWorkspaceContext(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  let requestedWsId = (req.headers['x-workspace-id'] as string) || (req.query.workspaceId as string);

  const user = req.authUser || SEEDED_USERS[0];
  const userWsId = (user as any).workspaceId || 'nest-realty-demo';
  if (!requestedWsId) {
    requestedWsId = userWsId;
  }

  if (requestedWsId === 'nest-realty-wilmington') {
    requestedWsId = 'nest-realty-demo';
  }

  // Query live workspace user memberships dynamically
  const liveUsers = workspaceUsersResolver();
  const activeMembership = liveUsers.find(u => 
    (u.id === user.id || u.email === user.email) && u.workspaceId === requestedWsId
  ) || SEEDED_MEMBERSHIPS.find(m => (m.userId === user.id || m.id === `m_${user.id.replace('usr_', '')}`) && m.workspaceId === requestedWsId);

  // Check explicit membership match
  const isMember = (activeMembership && activeMembership.workspaceId === requestedWsId) || (userWsId === requestedWsId) || user.role === 'admin';

  const memberRole = activeMembership?.role || user.role || 'owner';
  const basePermissions = ROLE_PERMISSIONS[memberRole] || ROLE_PERMISSIONS.owner;
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

    const hasPermission = membership.permissions.includes(permission) || membership.role === 'admin';
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
  const allowedEmails = ['marcus@shapework.co', 'matt@shapework.co', 'adam@shapework.co'];
  const allowedIds = ['usr_marcus', 'usr_matt', 'usr_adam'];
  if (!req.authUser || (!allowedEmails.includes(req.authUser.email) && !allowedIds.includes(req.authUser.id))) {
    return res.status(403).json({ error: 'Forbidden', message: 'Restricted to shapework administrative and engineering staff.' });
  }
  next();
}
