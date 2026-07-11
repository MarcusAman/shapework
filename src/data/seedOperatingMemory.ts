import { RoutingRule, SecureActionLink, IntegrationEvent } from '../types/operatingMemory';

export const defaultRoutingRules: RoutingRule[] = [
  {
    id: 'rule_1',
    requestType: 'marketing',
    routeToRole: 'marketing_coordinator',
    slaHours: 24,
    requiresOwnerReview: false,
    clarificationRequiredFields: ['property', 'desired launch date', 'requested asset type'],
    approvalRequiredFor: ['budget_over_500']
  },
  {
    id: 'rule_2',
    requestType: 'listing_launch',
    routeToRole: 'listing_coordinator',
    slaHours: 12,
    requiresOwnerReview: false,
    clarificationRequiredFields: ['property_address', 'lockbox_code', 'listing_agreement'],
    approvalRequiredFor: ['mls_submission']
  },
  {
    id: 'rule_3',
    requestType: 'transaction',
    routeToRole: 'transaction_coordinator',
    slaHours: 8,
    requiresOwnerReview: false,
    clarificationRequiredFields: ['property_address', 'party_email'],
    approvalRequiredFor: []
  },
  {
    id: 'rule_4',
    requestType: 'compliance',
    routeToRole: 'compliance_partner',
    slaHours: 24,
    requiresOwnerReview: false,
    clarificationRequiredFields: ['document_name', 'signature_missing'],
    approvalRequiredFor: ['owner_escalation']
  },
  {
    id: 'rule_5',
    requestType: 'sign_inventory',
    routeToRole: 'sign_inventory_owner',
    slaHours: 48,
    requiresOwnerReview: false,
    clarificationRequiredFields: ['property_address', 'sign_type'],
    approvalRequiredFor: []
  },
  {
    id: 'rule_6',
    requestType: 'onboarding',
    routeToRole: 'agent_onboarding_owner',
    slaHours: 72,
    requiresOwnerReview: false,
    clarificationRequiredFields: ['agent_name', 'onboarding_pack_signed'],
    approvalRequiredFor: []
  },
  {
    id: 'rule_7',
    requestType: 'commission_dispute',
    routeToRole: 'brokerage_owner',
    slaHours: 4,
    requiresOwnerReview: true,
    clarificationRequiredFields: ['disputed_amount', 'reason_description'],
    approvalRequiredFor: ['ledger_adjustment']
  },
  {
    id: 'rule_8',
    requestType: 'legal_dispute',
    routeToRole: 'brokerage_owner',
    slaHours: 2,
    requiresOwnerReview: true,
    clarificationRequiredFields: ['disclosing_party', 'property_address', 'threat_type'],
    approvalRequiredFor: ['external_counsel']
  },
  {
    id: 'rule_9',
    requestType: 'partnership_growth',
    routeToRole: 'brokerage_owner',
    slaHours: 48,
    requiresOwnerReview: true,
    clarificationRequiredFields: ['proposal_summary'],
    approvalRequiredFor: []
  },
  {
    id: 'rule_10',
    requestType: 'routine_office',
    routeToRole: 'operations_lead',
    slaHours: 24,
    requiresOwnerReview: false,
    clarificationRequiredFields: ['office_location', 'item_description'],
    approvalRequiredFor: []
  }
];

export const defaultSecureLinks: SecureActionLink[] = [
  {
    id: 'link_1',
    token: 'clarify_todd_mktg',
    linkType: 'clarification',
    relatedRecordId: 'req_vague_mktg',
    recipientRole: 'agent',
    recipientName: 'Todd Howard',
    expiresAt: '2026-07-06T12:00:00Z',
    status: 'sent_demo',
    requiredFields: ['property_address', 'launch_date', 'asset_type'],
    auditEventIds: []
  },
  {
    id: 'link_2',
    token: 'upload_ccg_1',
    linkType: 'document_upload',
    relatedRecordId: 'ccg_1',
    recipientRole: 'agent',
    recipientName: 'Alex Carter',
    expiresAt: '2026-07-04T12:00:00Z',
    status: 'sent_demo',
    requiredFields: ['Buyer Agency Agreement (Unsigned)'],
    auditEventIds: []
  },
  {
    id: 'link_3',
    token: 'sign_inventory_todd',
    linkType: 'sign_request',
    relatedRecordId: 'inv_1',
    recipientRole: 'agent',
    recipientName: 'Todd Howard',
    expiresAt: '2026-07-08T12:00:00Z',
    status: 'sent_demo',
    requiredFields: ['sign_type', 'property_address'],
    auditEventIds: []
  }
];

export const defaultIntegrationEvents: IntegrationEvent[] = [
  {
    id: 'evt_1',
    timestamp: '2026-06-29T10:00:00Z',
    source: 'mls_demo',
    eventType: 'mls_status_under_contract',
    payload: {
      propertyAddress: '109 Woodlawn Addendum',
      agentName: 'Emma Watson',
      contractDate: '2026-06-29',
      closingDate: '2026-07-30'
    },
    processed: false
  }
];
