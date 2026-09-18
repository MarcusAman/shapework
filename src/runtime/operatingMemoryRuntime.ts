import { RoutingRule, SecureActionLink } from '../types/operatingMemory';
import { AgentRequest } from '../types/shapework';

export const STAFF_DIRECTORY = {
  brokerage_owner: { name: 'Alex Carter', team: 'Brokerage Ops' },
  operations_lead: { name: 'Ann Gunn', team: 'Operations' },
  transaction_coordinator: { name: 'Diane Ross', team: 'Transaction Coordination' },
  listing_coordinator: { name: 'Diane Ross', team: 'Listing Coordination' },
  marketing_coordinator: { name: 'Diane Ross', team: 'Marketing' },
  compliance_partner: { name: 'Jessica Keenan', team: 'Compliance' },
  agent_onboarding_owner: { name: 'Ann Gunn', team: 'Operations' },
  sign_inventory_owner: { name: 'Emma Watson', team: 'Listing Coordination' },
  review_request_owner: { name: 'Ann Gunn', team: 'Operations' }
};

export function getStaffForRole(role: string) {
  return STAFF_DIRECTORY[role as keyof typeof STAFF_DIRECTORY] || { name: 'Ann Gunn', team: 'Operations' };
}

export function routeRequest(request: AgentRequest, rules: RoutingRule[]): AgentRequest {
  const rule = rules.find(r => r.requestType === request.requestType);
  if (!rule) {
    return {
      ...request,
      assignedTeam: 'Operations',
      assignedOwner: 'Ann Gunn',
      status: 'routed'
    };
  }

  const staff = getStaffForRole(rule.routeToRole);
  const shouldEscalate = rule.requiresOwnerReview || request.shouldEscalateToOwner;

  return {
    ...request,
    assignedTeam: staff.team,
    assignedOwner: shouldEscalate ? 'Alex Carter' : staff.name,
    status: shouldEscalate ? 'escalated' : 'routed',
    shouldEscalateToOwner: shouldEscalate,
    escalationReason: shouldEscalate ? `Requires direct owner review under ${rule.requestType} rule.` : undefined
  };
}

export function createSecureLink(
  linkType: SecureActionLink['linkType'],
  relatedRecordId: string,
  recipientName: string,
  requiredFields: string[]
): SecureActionLink {
  const token = `${linkType}_${Math.random().toString(36).substring(2, 9)}`;
  const expiresAt = new Date(Date.now() + 86400000 * 3).toISOString(); // 3 days expiry

  let recipientRole = 'agent';
  if (linkType === 'review_request') recipientRole = 'client';

  return {
    id: `link_${Math.random().toString(36).substring(2, 9)}`,
    token,
    linkType,
    relatedRecordId,
    recipientRole,
    recipientName,
    expiresAt,
    status: 'draft',
    requiredFields,
    auditEventIds: []
  };
}
