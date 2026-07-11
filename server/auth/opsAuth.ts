import { UserMembership } from '../headless/opsBlueprintTypes';

// Define the permissions mapping for each Role ID
export const OOPS_ROLE_PERMISSIONS: Record<string, string[]> = {
  platform_admin: ['*'], // wildcard access
  org_owner: ['*'],      // wildcard access within organization
  brokerage_admin: [
    'request:create', 'request:view:organization', 'request:update', 'request:assign', 'request:escalate', 'request:complete', 'request:delete',
    'asset:view', 'asset:checkout', 'asset:checkin', 'asset:manage', 'asset:mark_missing', 'asset:mark_damaged',
    'sop:view', 'sop:create', 'sop:update', 'sop:approve', 'sop:delete',
    'knowledge:view', 'knowledge:create', 'knowledge:approve', 'knowledge:update',
    'integration:view', 'integration:manage', 'integration:sync',
    'user:invite', 'user:manage', 'role:manage', 'audit:view', 'settings:manage',
    'dashboard:view:executive', 'dashboard:view:department', 'dashboard:view:office', 'dashboard:view:organization'
  ],
  regional_leader: [
    'request:create', 'request:view:organization', 'request:update', 'request:assign', 'request:escalate', 'request:complete',
    'asset:view', 'asset:checkout', 'asset:checkin', 'asset:manage', 'asset:mark_missing', 'asset:mark_damaged',
    'sop:view', 'sop:create', 'sop:update', 'sop:approve',
    'knowledge:view', 'knowledge:create', 'knowledge:approve', 'knowledge:update',
    'integration:view', 'audit:view',
    'dashboard:view:executive', 'dashboard:view:department', 'dashboard:view:office', 'dashboard:view:organization'
  ],
  bic: [
    'request:create', 'request:view:office', 'request:view:assigned', 'request:view:department', 'request:update', 'request:assign', 'request:escalate', 'request:complete',
    'asset:view', 'asset:checkout', 'asset:checkin',
    'sop:view',
    'knowledge:view', 'knowledge:create', 'knowledge:approve', 'knowledge:update',
    'dashboard:view:office', 'dashboard:view:department'
  ],
  operations_manager: [
    'request:create', 'request:view:office', 'request:view:department', 'request:update', 'request:assign', 'request:complete',
    'asset:view', 'asset:checkout', 'asset:checkin', 'asset:manage', 'asset:mark_missing', 'asset:mark_damaged',
    'sop:view', 'sop:create', 'sop:update',
    'dashboard:view:office', 'dashboard:view:department'
  ],
  accounting_manager: [
    'request:create', 'request:view:office', 'request:view:department', 'request:update', 'request:assign', 'request:complete',
    'asset:view',
    'sop:view',
    'dashboard:view:office', 'dashboard:view:department'
  ],
  marketing_manager: [
    'request:create', 'request:view:office', 'request:view:department', 'request:update', 'request:assign', 'request:complete',
    'asset:view',
    'sop:view', 'sop:create', 'sop:update',
    'dashboard:view:office', 'dashboard:view:department'
  ],
  staff_member: [
    'request:create', 'request:view:assigned', 'request:view:office', 'request:update', 'request:complete',
    'asset:view', 'asset:checkout', 'asset:checkin',
    'sop:view',
    'dashboard:view:own', 'dashboard:view:office'
  ],
  agent: [
    'request:create', 'request:view:own', 'request:update',
    'asset:view', 'asset:checkout', 'asset:checkin',
    'sop:view',
    'knowledge:view',
    'dashboard:view:own'
  ],
  triage_operator: [
    'request:create', 'request:view:office', 'request:view:department', 'request:update', 'request:assign',
    'asset:view',
    'sop:view',
    'dashboard:view:department'
  ],
  viewer: [
    'request:view:own', 'asset:view', 'sop:view', 'knowledge:view', 'dashboard:view:own'
  ]
};

/**
 * Check if user has permission to perform action on resource
 */
export function can(userRole: string, permission: string): boolean {
  if (!userRole) return false;
  const permissions = OOPS_ROLE_PERMISSIONS[userRole] || [];
  if (permissions.includes('*')) return true;
  return permissions.includes(permission);
}

/**
 * Scope based records filter
 */
export function filterRequestsByAccess(
  userMembership: UserMembership,
  requests: any[]
): any[] {
  const role = userMembership.roleId;

  // Wildcards
  if (role === 'platform_admin' || role === 'org_owner' || role === 'brokerage_admin' || role === 'regional_leader') {
    return requests.filter(r => r.organizationId === userMembership.organizationId);
  }

  // Department managers (Operations / Accounting / Marketing)
  if (role === 'operations_manager') {
    return requests.filter(r => 
      r.organizationId === userMembership.organizationId &&
      (r.assignedRole === 'operations_manager' || r.category === 'office_supplies' || r.category === 'room_reservation' || r.category === 'vendor_maintenance' || r.category === 'event_support' || r.category === 'lockboxes_keys' || r.category === 'signs_riders')
    );
  }

  if (role === 'accounting_manager') {
    return requests.filter(r => 
      r.organizationId === userMembership.organizationId &&
      (r.assignedRole === 'accounting_manager' || r.category === 'accounting_commissions' || r.category === 'payables_bills_receipts')
    );
  }

  if (role === 'marketing_manager') {
    return requests.filter(r => 
      r.organizationId === userMembership.organizationId &&
      (r.assignedRole === 'marketing_manager' || r.category === 'marketing_request' || r.category === 'listing_marketing' || r.category === 'agent_branding' || r.category === 'business_cards_print' || r.category === 'signs_riders')
    );
  }

  // BIC
  if (role === 'bic') {
    return requests.filter(r => 
      r.organizationId === userMembership.organizationId &&
      (r.assignedRole === 'bic' || r.category === 'compliance' || r.category === 'contract_transaction' || r.category === 'agent_question')
    );
  }

  // Triage Operator
  if (role === 'triage_operator') {
    return requests.filter(r => 
      r.organizationId === userMembership.organizationId &&
      (r.assignedRole === 'triage_operator' || r.assignedOwner === 'Shapework Triage' || r.category === 'unknown_owner')
    );
  }

  // Agent (Can only see own requests)
  if (role === 'agent') {
    return requests.filter(r => r.requesterEmail === userMembership.userId || r.userId === userMembership.userId);
  }

  // Default fallback (viewer / others)
  return requests.filter(r => r.requesterEmail === userMembership.userId || r.assignedOwner === userMembership.userId);
}
