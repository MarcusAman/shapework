/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Canonical Task Routing Service
 * Single source of truth for routing incoming brokerage requests and tasks.
 * 
 * Intended Architecture:
 * Intake → Classification → Published SOP → Routing Rule → Responsible Role → Canonical Staff ID → OOO Coverage → Task Persistence → Audit Event
 * 
 * Rules:
 * 1. Server-controlled routing based strictly on active published routing policies.
 * 2. Immutable Canonical Staff IDs from operations directory (never display-name substring matching).
 * 3. OOO coverage evaluation with cycle prevention.
 * 4. SOP provenance stamped immutably with ID and version.
 * 5. Ambiguous or unclassifiable requests placed safely into triage with no fabricated assignees.
 * 6. Client-provided assignees or roles are strictly proposals and never authoritative.
 */

import { orgChartRepository, PublishedRoutingPolicy, PublishedRoutingRule } from '../persistence/orgChartRepository.js';
import { 
  resolveStaffMember, 
  resolveActiveCoveringStaff, 
  validateBackupAssignment,
  getAllStaffMembers, 
  StaffMemberProfile 
} from '../persistence/operationsDirectoryRepository.js';
import { sopRepository } from '../persistence/sopRepository.js';
import { recordActivityEvent } from './activityHistoryService.js';
import { validateSopCompatibility, isSopCompatibleWithCategory } from '../policies/sopCategoryCompatibility.js';

export interface TaskRoutingInput {
  workspaceId: string;
  category?: string;
  subcategory?: string;
  requestType?: string;
  deliverableType?: string;
  title?: string;
  transcript?: string;
  channel: 'web' | 'phone' | 'email' | 'manual' | 'mms' | 'system';
  requesterPersonId?: string;
  requesterName?: string;
  requesterEmail?: string;
  requesterPhone?: string;
  propertyAddress?: string;
  classificationConfidence?: number;
  clientProposedAssignee?: string;
  clientProposedRole?: string;
  taskId?: string;
  requestId?: string;
  callId?: string;
}

export interface TaskRoutingDecision {
  routingState: 'resolved' | 'triage_required' | 'configuration_error' | 'escalated';
  routingPolicyId?: string;
  routingPolicyVersion?: number;
  routingRuleId?: string;
  departmentId?: string;
  primaryRoleId?: string;
  reviewRoleId?: string;
  fulfillmentRoleId?: string;
  assigneeStaffId?: string;
  assigneeName?: string;
  assigneeRole?: string;
  originalAssigneeId?: string;
  originalAssigneeName?: string;
  assigneeCoveringStaffId?: string;
  assigneeCoveringStaffName?: string;
  reviewOwnerStaffId?: string;
  reviewOwnerName?: string;
  reviewOwnerRole?: string;
  originalReviewOwnerId?: string;
  originalReviewOwnerName?: string;
  reviewCoveringStaffId?: string;
  reviewCoveringStaffName?: string;
  governingSopId?: string;
  governingSopVersion?: string;
  governingSopTitle?: string;
  matchedRuleId?: string;
  ruleVersion?: number;
  confidence: number;
  reasonCodes: string[];
  coveringStaffId?: string;
  coveringStaffName?: string;
  originalStaffId?: string;
  originalStaffName?: string;
  slaHours?: number;
  slaDisplay?: string;
  escalationPolicyId?: string;
  missingFacts?: string[];
  triageReason?: string;
  routedAt?: string;
  snapshot: Record<string, any>;
}

/**
 * Normalizes category and intent keywords from input.
 */
function normalizeCategoryAndIntent(input: TaskRoutingInput): {
  normalizedCategory: string;
  normalizedKeywords: string[];
} {
  // Explicit category matching takes priority over ambient transcript
  const explicitCategory = (input.category || '').toLowerCase();
  if (
    explicitCategory === 'print' ||
    explicitCategory === 'social' ||
    explicitCategory === 'marketing' ||
    explicitCategory === 'marketing_collateral' ||
    explicitCategory === 'farming' ||
    explicitCategory === 'open_house'
  ) {
    return {
      normalizedCategory: 'marketing',
      normalizedKeywords: ['marketing', 'flyer', 'brochure', 'social', 'open_house']
    };
  }
  if (
    explicitCategory === 'signage' ||
    explicitCategory === 'yard_post' ||
    explicitCategory === 'signs'
  ) {
    return {
      normalizedCategory: 'signage',
      normalizedKeywords: ['signs', 'post', 'riders']
    };
  }
  if (
    explicitCategory === 'lockbox' ||
    explicitCategory === 'lockboxes' ||
    explicitCategory === 'keys'
  ) {
    return {
      normalizedCategory: 'lockboxes',
      normalizedKeywords: ['lockbox', 'lockboxes', 'keys']
    };
  }
  if (
    explicitCategory === 'room_reservation' ||
    explicitCategory === 'conference_room'
  ) {
    return {
      normalizedCategory: 'room_reservation',
      normalizedKeywords: ['room reservation', 'conference room']
    };
  }
  if (
    explicitCategory === 'vendor_maintenance' ||
    explicitCategory === 'maintenance' ||
    explicitCategory === 'vendor'
  ) {
    return {
      normalizedCategory: 'vendor_maintenance',
      normalizedKeywords: ['vendor / maintenance', 'vendor', 'maintenance', 'repair']
    };
  }
  if (
    explicitCategory === 'event_support' ||
    explicitCategory === 'event'
  ) {
    return {
      normalizedCategory: 'event_support',
      normalizedKeywords: ['event support', 'event']
    };
  }
  if (explicitCategory === 'contracts' || explicitCategory === 'compliance') {
    return {
      normalizedCategory: 'contracts',
      normalizedKeywords: ['contract', 'form_2t', 'compliance', 'emd']
    };
  }
  if (explicitCategory === 'accounting' || explicitCategory === 'finance') {
    return {
      normalizedCategory: 'accounting',
      normalizedKeywords: ['commission', 'cda', 'accounting', 'closings']
    };
  }
  if (explicitCategory === 'technology' || explicitCategory === 'it_systems' || explicitCategory === 'tech') {
    return {
      normalizedCategory: 'technology',
      normalizedKeywords: ['technology', 'it', 'systems', 'wifi', 'hardware']
    };
  }
  if (
    explicitCategory === 'operations' ||
    explicitCategory === 'facilities' ||
    explicitCategory === 'office_supplies' ||
    explicitCategory === 'supplies'
  ) {
    return {
      normalizedCategory: 'operations',
      normalizedKeywords: ['operations', 'facilities', 'supplies', 'office supplies', 'restock']
    };
  }

  // Deliverable-specific title/type checks take priority over ambient transcript
  const deliverableText = [
    input.subcategory || '',
    input.requestType || '',
    input.deliverableType || '',
    input.title || ''
  ].join(' ').toLowerCase();

  if (
    deliverableText.includes('restock') ||
    deliverableText.includes('office supplies') ||
    deliverableText.includes('water bottle') ||
    deliverableText.includes('bottled water') ||
    deliverableText.includes('soda') ||
    deliverableText.includes('drink') ||
    deliverableText.includes('coffee')
  ) {
    return {
      normalizedCategory: 'operations',
      normalizedKeywords: ['operations', 'facilities', 'supplies', 'office supplies', 'restock']
    };
  }

  if (
    deliverableText.includes('flyer') ||
    deliverableText.includes('brochure') ||
    deliverableText.includes('feature sheet') ||
    deliverableText.includes('postcard') ||
    deliverableText.includes('social media') ||
    deliverableText.includes('instagram') ||
    deliverableText.includes('facebook')
  ) {
    return {
      normalizedCategory: 'marketing',
      normalizedKeywords: ['marketing', 'flyer', 'brochure', 'social', 'open_house']
    };
  }
  if (
    deliverableText.includes('lockbox') ||
    deliverableText.includes('supra') ||
    deliverableText.includes('keys')
  ) {
    return {
      normalizedCategory: 'lockboxes',
      normalizedKeywords: ['lockbox', 'lockboxes', 'keys']
    };
  }
  if (
    deliverableText.includes('room reservation') ||
    deliverableText.includes('conference room') ||
    deliverableText.includes('boardroom')
  ) {
    return {
      normalizedCategory: 'room_reservation',
      normalizedKeywords: ['room reservation', 'conference room']
    };
  }
  if (
    deliverableText.includes('vendor') ||
    deliverableText.includes('maintenance') ||
    deliverableText.includes('repair') ||
    deliverableText.includes('hvac')
  ) {
    return {
      normalizedCategory: 'vendor_maintenance',
      normalizedKeywords: ['vendor / maintenance', 'vendor', 'maintenance', 'repair']
    };
  }
  if (
    deliverableText.includes('sign post') ||
    deliverableText.includes('yard sign') ||
    deliverableText.includes('post install') ||
    deliverableText.includes('rider')
  ) {
    return {
      normalizedCategory: 'signage',
      normalizedKeywords: ['signs', 'post', 'riders']
    };
  }

  const parts = [
    deliverableText,
    input.transcript ? input.transcript.slice(0, 300) : ''
  ];
  const combined = parts.join(' ').toLowerCase();

  // 1a. Lockboxes & Keys
  if (
    combined.includes('lockbox') ||
    combined.includes('supra') ||
    combined.includes('lock box') ||
    combined.includes('keys')
  ) {
    return {
      normalizedCategory: 'lockboxes',
      normalizedKeywords: ['lockboxes / keys', 'lockbox', 'lockboxes', 'key', 'keys']
    };
  }

  // 1b. Room Reservation
  if (
    combined.includes('room reservation') ||
    combined.includes('conference room') ||
    combined.includes('boardroom')
  ) {
    return {
      normalizedCategory: 'room_reservation',
      normalizedKeywords: ['room reservation', 'conference room']
    };
  }

  // 1c. Vendor / Maintenance
  if (
    combined.includes('vendor / maintenance') ||
    combined.includes('hvac') ||
    combined.includes('maintenance') ||
    combined.includes('repair')
  ) {
    return {
      normalizedCategory: 'vendor_maintenance',
      normalizedKeywords: ['vendor / maintenance', 'vendor', 'maintenance', 'repair']
    };
  }

  // 1d. Signage & Yard Post Installation
  if (
    combined.includes('sign post') ||
    combined.includes('yard sign') ||
    combined.includes('post install') ||
    combined.includes('rider') ||
    combined.includes('coastal sign post') ||
    input.category === 'signage' ||
    input.category === 'yard_post' ||
    input.category === 'signs'
  ) {
    return {
      normalizedCategory: 'signage',
      normalizedKeywords: ['signs', 'post', 'riders']
    };
  }

  // 2. Contracts, Form 2-T, Compliance & Earnest Money
  if (
    combined.includes('form 2-t') ||
    combined.includes('form 2t') ||
    combined.includes('earnest money') ||
    combined.includes('emd') ||
    combined.includes('compliance review') ||
    combined.includes('due diligence') ||
    combined.includes('purchase contract') ||
    combined.includes('bic review') ||
    input.category === 'contracts' ||
    input.category === 'compliance'
  ) {
    return {
      normalizedCategory: 'contracts',
      normalizedKeywords: ['contract', 'form_2t', 'compliance', 'emd']
    };
  }

  // 3. Accounting, Commissions & Closings
  if (
    combined.includes('commission') ||
    combined.includes('cda') ||
    combined.includes('closing pay') ||
    combined.includes('hud-1') ||
    combined.includes('alta') ||
    combined.includes('settlement statement') ||
    combined.includes('accounting') ||
    input.category === 'accounting' ||
    input.category === 'finance'
  ) {
    return {
      normalizedCategory: 'accounting',
      normalizedKeywords: ['commission', 'cda', 'accounting', 'closings']
    };
  }

  // 4. Technology, IT, Systems, Software & WiFi
  if (
    combined.includes('wifi') ||
    combined.includes('internet') ||
    combined.includes('printer') ||
    combined.includes('laptop') ||
    combined.includes('dotloop access') ||
    combined.includes('rechat access') ||
    combined.includes('email login') ||
    combined.includes('password reset') ||
    combined.includes('tech support') ||
    combined.includes('software issue') ||
    input.category === 'technology' ||
    input.category === 'it_systems' ||
    input.category === 'tech'
  ) {
    return {
      normalizedCategory: 'technology',
      normalizedKeywords: ['technology', 'it', 'systems', 'wifi', 'hardware']
    };
  }

  // 5. Marketing Collateral (Flyers, Brochures, Social Media, Postcards, Open House)
  if (
    combined.includes('flyer') ||
    combined.includes('brochure') ||
    combined.includes('feature sheet') ||
    combined.includes('postcard') ||
    combined.includes('social media') ||
    combined.includes('instagram') ||
    combined.includes('facebook story') ||
    combined.includes('open house') ||
    combined.includes('just listed') ||
    combined.includes('branding') ||
    combined.includes('marketing') ||
    input.category === 'marketing' ||
    input.category === 'marketing_collateral' ||
    input.category === 'print' ||
    input.category === 'social'
  ) {
    return {
      normalizedCategory: 'marketing',
      normalizedKeywords: ['marketing', 'flyer', 'brochure', 'social', 'open_house']
    };
  }

  // 6. General Operations & Facilities
  if (
    combined.includes('facility') ||
    combined.includes('office supplies') ||
    combined.includes('maintenance') ||
    combined.includes('hvac') ||
    combined.includes('key fob') ||
    combined.includes('restock') ||
    combined.includes('water bottle') ||
    combined.includes('bottled water') ||
    combined.includes('soda') ||
    combined.includes('drink') ||
    input.category === 'operations' ||
    input.category === 'facilities' ||
    input.category === 'office_supplies' ||
    input.category === 'supplies'
  ) {
    return {
      normalizedCategory: 'operations',
      normalizedKeywords: ['operations', 'facilities', 'supplies', 'office supplies', 'restock']
    };
  }

  return {
    normalizedCategory: (input.category || 'unknown').toLowerCase(),
    normalizedKeywords: []
  };
}

/**
 * Evaluates whether a published rule matches the normalized input.
 */
function isRuleMatch(rule: PublishedRoutingRule, category: string, keywords: string[]): boolean {
  if (rule.status !== 'active') return false;
  const ruleCat = rule.category.toLowerCase();
  
  if (ruleCat === category) return true;

  // Category aliases
  if (category === 'marketing') {
    if (['marketing request', 'listing marketing', 'agent branding', 'business cards / print materials', 'marketing_collateral', 'print', 'social'].includes(ruleCat)) {
      return true;
    }
  }

  if (category === 'signage') {
    if (['signs / riders', 'signage', 'yard_post'].includes(ruleCat)) {
      return true;
    }
  }

  if (category === 'lockboxes' || category === 'lockbox') {
    if (['lockboxes / keys', 'lockbox'].includes(ruleCat)) {
      return true;
    }
  }

  if (category === 'room_reservation') {
    if (['room reservation'].includes(ruleCat)) {
      return true;
    }
  }

  if (category === 'vendor_maintenance' || category === 'maintenance') {
    if (['vendor / maintenance', 'vendor', 'maintenance'].includes(ruleCat)) {
      return true;
    }
  }

  if (category === 'event_support') {
    if (['event support'].includes(ruleCat)) {
      return true;
    }
  }

  if (category === 'office_supplies' || category === 'supplies') {
    if (['office supplies'].includes(ruleCat)) {
      return true;
    }
  }

  if (category === 'technology') {
    if (['it / systems', 'technology', 'it_systems', 'tech'].includes(ruleCat)) {
      return true;
    }
  }

  if (category === 'contracts') {
    if (['compliance', 'contract / transaction issue', 'broker-in-charge question', 'contracts'].includes(ruleCat)) {
      return true;
    }
  }

  if (category === 'accounting') {
    if (['accounting / commissions', 'payables / bills / receipts', 'accounting', 'finance'].includes(ruleCat)) {
      return true;
    }
  }

  if (category === 'operations') {
    if (['office supplies', 'vendor / maintenance', 'room reservation', 'event support', 'operations'].includes(ruleCat)) {
      return true;
    }
  }

  // Check rule keywords
  if (rule.match_keywords && rule.match_keywords.length > 0) {
    const hasKeywordMatch = rule.match_keywords.some(k => keywords.includes(k.toLowerCase()));
    if (hasKeywordMatch) return true;
  }

  return false;
}

/**
 * Evaluates routing decision using loaded published policy and rules.
 */
export function evaluateRoutingDecision(
  input: TaskRoutingInput,
  publishedData: { policy: PublishedRoutingPolicy; rules: PublishedRoutingRule[] } | null
): TaskRoutingDecision {
  const workspaceId = input.workspaceId || 'ws_wilmington';
  const reasonCodes: string[] = [];
  const missingFacts: string[] = [];

  // Security Check: Client-proposed assignee claim inspection
  if (input.clientProposedAssignee) {
    reasonCodes.push('CLIENT_ASSIGNMENT_PROPOSAL_RECEIVED');
    // Verify if client tried to specify an out-of-workspace ID
    const allStaff = getAllStaffMembers();
    const proposedStaff = resolveStaffMember(input.clientProposedAssignee, workspaceId, allStaff);
    const isInvalidOrCrossWorkspace = !proposedStaff || Boolean(
      proposedStaff.workspaceId && 
      proposedStaff.workspaceId !== workspaceId && 
      !(workspaceId === 'nest-realty-demo' && proposedStaff.workspaceId === 'ws_wilmington') &&
      !(workspaceId === 'ws_wilmington' && proposedStaff.workspaceId === 'nest-realty-demo')
    );
    if (isInvalidOrCrossWorkspace) {
      reasonCodes.push('SECURITY_CROSS_WORKSPACE_OR_INVALID_STAFF_CLAIM_REJECTED');
    }
  }

  if (!publishedData || !publishedData.policy || !publishedData.rules || publishedData.rules.length === 0) {
    return {
      routingState: 'configuration_error',
      confidence: 0,
      reasonCodes: ['NO_PUBLISHED_POLICY'],
      triageReason: `No published routing policy exists for workspace "${workspaceId}". Brokerage owner must publish a Role & Escalation Map.`,
      snapshot: {
        workspaceId,
        evaluatedAt: new Date().toISOString(),
        inputSummary: { channel: input.channel, category: input.category, title: input.title }
      }
    };
  }

  const { policy, rules } = publishedData;

  // 2. Classification & Ambiguity checks
  const { normalizedCategory, normalizedKeywords } = normalizeCategoryAndIntent(input);
  const confidence = input.classificationConfidence !== undefined ? input.classificationConfidence : 0.95;

  if (confidence < 0.7) {
    reasonCodes.push('LOW_CLASSIFICATION_CONFIDENCE');
    return {
      routingState: 'triage_required',
      confidence,
      reasonCodes,
      missingFacts: ['classification_confidence'],
      triageReason: `Request classification confidence (${(confidence * 100).toFixed(0)}%) is below the automated threshold (70%). Manager review required.`,
      snapshot: {
        policyId: policy.id,
        policyVersion: policy.version,
        confidence,
        inputCategory: input.category,
        normalizedCategory
      }
    };
  }

  // 3. Find matching published routing rule
  let matchedRule: PublishedRoutingRule | undefined;
  for (const rule of rules) {
    if (isRuleMatch(rule, normalizedCategory, normalizedKeywords)) {
      matchedRule = rule;
      break;
    }
  }

  if (!matchedRule) {
    reasonCodes.push('NO_MATCHING_RULE');
    return {
      routingState: 'triage_required',
      confidence,
      reasonCodes,
      triageReason: `No published routing rule matched category "${normalizedCategory || input.category || 'unspecified'}". Work item placed in triage.`,
      snapshot: {
        policyId: policy.id,
        policyVersion: policy.version,
        normalizedCategory,
        channel: input.channel,
        routedAt: new Date().toISOString()
      }
    };
  }

  reasonCodes.push('CANONICAL_RULE_MATCH', `RULE_MATCHED_${matchedRule.id}`);

  // 3b. Validate SOP compatibility & Category Integrity
  if (matchedRule.governing_sop_id) {
    const sopValidation = validateSopCompatibility(matchedRule.governing_sop_id, matchedRule.category, workspaceId);
    if (!sopValidation.valid) {
      reasonCodes.push('INCOMPATIBLE_OR_INVALID_SOP', sopValidation.errorCode || 'SOP_VALIDATION_FAILED');
      return {
        routingState: 'configuration_error',
        routingPolicyId: policy.id,
        routingPolicyVersion: policy.version,
        routingRuleId: matchedRule.id,
        matchedRuleId: matchedRule.id,
        ruleVersion: policy.version,
        departmentId: matchedRule.category,
        confidence: 0,
        reasonCodes,
        triageReason: `Published rule "${matchedRule.display_name || matchedRule.category}" has an incompatible or invalid governing SOP "${matchedRule.governing_sop_id}": ${sopValidation.errorMessage}`,
        snapshot: {
          routingPolicyId: policy.id,
          routingPolicyVersion: policy.version,
          routingRuleId: matchedRule.id,
          category: matchedRule.category,
          invalidSopId: matchedRule.governing_sop_id,
          error: sopValidation.errorMessage,
          routedAt: new Date().toISOString()
        }
      };
    }
  } else {
    // If no governing SOP is assigned on the rule, check if category is technology/IT
    if (normalizedCategory === 'technology') {
      reasonCodes.push('NO_APPROVED_SOP_FOR_CATEGORY', 'TECHNOLOGY_SOP_MISSING');
      return {
        routingState: 'triage_required',
        routingPolicyId: policy.id,
        routingPolicyVersion: policy.version,
        routingRuleId: matchedRule.id,
        matchedRuleId: matchedRule.id,
        ruleVersion: policy.version,
        departmentId: matchedRule.category,
        primaryRoleId: matchedRule.primary_role_id,
        fulfillmentRoleId: matchedRule.primary_role_id,
        confidence: 0.8,
        reasonCodes,
        triageReason: 'No approved Standard Operating Procedure exists for Technology / Systems. Brokerage policy requires manager review and SOP assignment before automated dispatch.',
        snapshot: {
          routingPolicyId: policy.id,
          routingPolicyVersion: policy.version,
          routingRuleId: matchedRule.id,
          category: matchedRule.category,
          channel: input.channel,
          reason: 'NO_APPROVED_SOP_FOR_CATEGORY',
          routedAt: new Date().toISOString()
        }
      };
    }
  }

  // 4. Validate Property Address for Location-Dependent Requests
  const isLocationDependent = ['marketing', 'signage'].includes(normalizedCategory);
  const hasPropertyAddress = Boolean(
    input.propertyAddress && 
    input.propertyAddress.trim() !== '' && 
    !input.propertyAddress.toLowerCase().includes('unknown') &&
    !input.propertyAddress.toLowerCase().includes('address pending') &&
    !input.propertyAddress.toLowerCase().includes('unspecified')
  );

  if (isLocationDependent && !hasPropertyAddress) {
    missingFacts.push('property_address');
    reasonCodes.push('MISSING_PROPERTY_ADDRESS', 'PROPERTY_ADDRESS_REQUIRED');
    return {
      routingState: 'triage_required',
      routingPolicyId: policy.id,
      routingPolicyVersion: policy.version,
      routingRuleId: matchedRule.id,
      matchedRuleId: matchedRule.id,
      ruleVersion: policy.version,
      departmentId: matchedRule.category,
      confidence: 0.5,
      missingFacts,
      reasonCodes,
      triageReason: 'Property address was not captured or requires verification before production assignment.',
      snapshot: {
        routingPolicyId: policy.id,
        routingPolicyVersion: policy.version,
        matchedRuleId: matchedRule.id,
        category: matchedRule.category,
        channel: input.channel,
        missingFacts,
        routedAt: new Date().toISOString()
      }
    };
  }

  // 5. Staff Resolution through Immutable Canonical Staff IDs
  const allStaff = getAllStaffMembers();
  const primaryStaff = resolveStaffMember(matchedRule.primary_staff_id, workspaceId, allStaff);

  if (!primaryStaff) {
    reasonCodes.push('PRIMARY_STAFF_NOT_FOUND');
    return {
      routingState: 'configuration_error',
      routingPolicyId: policy.id,
      routingPolicyVersion: policy.version,
      routingRuleId: matchedRule.id,
      matchedRuleId: matchedRule.id,
      ruleVersion: policy.version,
      confidence,
      reasonCodes,
      triageReason: `Published rule "${matchedRule.display_name || matchedRule.category}" references unresolvable staff ID "${matchedRule.primary_staff_id}".`,
      snapshot: { 
        routingPolicyId: policy.id, 
        ruleId: matchedRule.id, 
        primaryStaffId: matchedRule.primary_staff_id,
        routedAt: new Date().toISOString()
      }
    };
  }

  if (primaryStaff.status === 'inactive') {
    reasonCodes.push('PRIMARY_STAFF_INACTIVE');
    return {
      routingState: 'configuration_error',
      routingPolicyId: policy.id,
      routingPolicyVersion: policy.version,
      routingRuleId: matchedRule.id,
      matchedRuleId: matchedRule.id,
      ruleVersion: policy.version,
      confidence,
      reasonCodes,
      triageReason: `Configured primary assignee "${primaryStaff.fullName}" is marked inactive in workspace directory.`,
      snapshot: { 
        routingPolicyId: policy.id, 
        staffId: primaryStaff.id, 
        status: primaryStaff.status,
        routedAt: new Date().toISOString()
      }
    };
  }

  // Check workspace isolation on staff
  const isCrossWorkspace = Boolean(
    primaryStaff.workspaceId && 
    primaryStaff.workspaceId !== workspaceId && 
    !(workspaceId === 'nest-realty-demo' && primaryStaff.workspaceId === 'ws_wilmington') &&
    !(workspaceId === 'ws_wilmington' && primaryStaff.workspaceId === 'nest-realty-demo')
  );

  if (isCrossWorkspace) {
    reasonCodes.push('CROSS_WORKSPACE_STAFF_FORBIDDEN');
    return {
      routingState: 'configuration_error',
      routingPolicyId: policy.id,
      routingPolicyVersion: policy.version,
      confidence,
      reasonCodes,
      triageReason: `Configured staff "${primaryStaff.fullName}" belongs to workspace "${primaryStaff.workspaceId}", not "${workspaceId}".`,
      snapshot: { 
        staffWorkspace: primaryStaff.workspaceId, 
        targetWorkspace: workspaceId,
        routedAt: new Date().toISOString()
      }
    };
  }

  // 6. Apply Out-of-Office (OOO) Coverage Engine for Assignee / Producer
  let finalAssigneeStaff = primaryStaff;
  let assigneeCoveringStaff: StaffMemberProfile | undefined;
  let originalAssigneeStaff: StaffMemberProfile | undefined;

  if (primaryStaff.status === 'out_of_office') {
    originalAssigneeStaff = primaryStaff;
    const resolvedBackup = resolveActiveCoveringStaff(primaryStaff.id, workspaceId, allStaff);
    
    if (resolvedBackup) {
      // Validate coverage assignment
      const validation = validateBackupAssignment(primaryStaff.id, resolvedBackup.id, workspaceId, allStaff);
      if (validation.valid && validation.backup) {
        assigneeCoveringStaff = validation.backup;
        finalAssigneeStaff = validation.backup;
        reasonCodes.push('OOO_COVERAGE_APPLIED', 'STAFF_OUT_OF_OFFICE_COVERAGE_APPLIED');
      } else {
        reasonCodes.push('OOO_COVERAGE_CYCLE_OR_UNAVAILABLE');
        return {
          routingState: 'triage_required',
          routingPolicyId: policy.id,
          routingPolicyVersion: policy.version,
          routingRuleId: matchedRule.id,
          matchedRuleId: matchedRule.id,
          ruleVersion: policy.version,
          departmentId: matchedRule.category,
          confidence: 0.5,
          reasonCodes,
          triageReason: `Primary assignee "${primaryStaff.fullName}" is out of office, but candidate backup is invalid or in a circular loop (${validation.error}). Task routed to triage.`,
          snapshot: { 
            routingPolicyId: policy.id,
            primaryStaffId: primaryStaff.id, 
            error: validation.error,
            routedAt: new Date().toISOString()
          }
        };
      }
    } else {
      reasonCodes.push('OOO_COVERAGE_CYCLE_OR_UNAVAILABLE');
      return {
        routingState: 'triage_required',
        routingPolicyId: policy.id,
        routingPolicyVersion: policy.version,
        matchedRuleId: matchedRule.id,
        ruleVersion: policy.version,
        departmentId: matchedRule.category,
        confidence: 0.5,
        reasonCodes,
        triageReason: `Primary assignee "${primaryStaff.fullName}" is out of office and has no active backup staff assigned. Task routed to triage.`,
        snapshot: { 
          routingPolicyId: policy.id,
          primaryStaffId: primaryStaff.id,
          routedAt: new Date().toISOString()
        }
      };
    }
  }

  // 7. Resolve Review Owner (Manager Role Separation strictly from published rule)
  let reviewOwnerStaff: StaffMemberProfile | undefined;
  if (matchedRule.review_staff_id) {
    reviewOwnerStaff = resolveStaffMember(matchedRule.review_staff_id, workspaceId, allStaff);
  }

  let finalReviewOwner = reviewOwnerStaff;
  let reviewCoveringStaff: StaffMemberProfile | undefined;
  let originalReviewOwnerStaff: StaffMemberProfile | undefined;

  if (reviewOwnerStaff && reviewOwnerStaff.status === 'out_of_office') {
    originalReviewOwnerStaff = reviewOwnerStaff;
    const backupReviewer = resolveActiveCoveringStaff(reviewOwnerStaff.id, workspaceId, allStaff);
    if (backupReviewer && backupReviewer.status !== 'inactive') {
      reviewCoveringStaff = backupReviewer;
      finalReviewOwner = backupReviewer;
      reasonCodes.push('REVIEW_OWNER_OOO_COVERAGE_APPLIED');
    }
  }

  // 7b. Self-Approval Prevention & Role-Boundary Enforcement
  if (finalReviewOwner && finalAssigneeStaff && finalReviewOwner.id === finalAssigneeStaff.id) {
    // Attempt secondary review escalation (e.g. BIC Ryan Crecelius)
    const bicStaff = resolveStaffMember('dir_ryan_crecelius_6', workspaceId, allStaff);
    if (bicStaff && bicStaff.id !== finalAssigneeStaff.id && bicStaff.status === 'active') {
      finalReviewOwner = bicStaff;
      reviewCoveringStaff = bicStaff;
      reasonCodes.push('SELF_APPROVAL_PREVENTED', 'ESCALATED_TO_BROKER_IN_CHARGE_FOR_REVIEW');
    } else {
      reasonCodes.push('SELF_APPROVAL_PREVENTED', 'ROLE_BOUNDARY_COLLAPSE_DETECTED');
      return {
        routingState: 'triage_required',
        routingPolicyId: policy.id,
        routingPolicyVersion: policy.version,
        routingRuleId: matchedRule.id,
        matchedRuleId: matchedRule.id,
        ruleVersion: policy.version,
        departmentId: matchedRule.category,
        primaryRoleId: matchedRule.primary_role_id,
        fulfillmentRoleId: matchedRule.primary_role_id,
        reviewRoleId: matchedRule.review_role_id,
        confidence: 0.5,
        reasonCodes,
        triageReason: `Self-approval prevented: Review authority delegation would make producer "${finalAssigneeStaff.fullName}" review their own work. Brokerage role separation policy requires manager triage.`,
        originalAssigneeId: originalAssigneeStaff?.id || primaryStaff.id,
        originalAssigneeName: originalAssigneeStaff?.fullName || primaryStaff.fullName,
        assigneeCoveringStaffId: assigneeCoveringStaff?.id,
        assigneeCoveringStaffName: assigneeCoveringStaff?.fullName,
        originalStaffId: originalAssigneeStaff?.id || primaryStaff.id,
        originalStaffName: originalAssigneeStaff?.fullName || primaryStaff.fullName,
        coveringStaffId: assigneeCoveringStaff?.id,
        coveringStaffName: assigneeCoveringStaff?.fullName,
        originalReviewOwnerId: originalReviewOwnerStaff?.id || reviewOwnerStaff?.id,
        originalReviewOwnerName: originalReviewOwnerStaff?.fullName || reviewOwnerStaff?.fullName,
        reviewCoveringStaffId: reviewCoveringStaff?.id,
        reviewCoveringStaffName: reviewCoveringStaff?.fullName,
        snapshot: {
          routingPolicyId: policy.id,
          routingPolicyVersion: policy.version,
          routingRuleId: matchedRule.id,
          primaryStaffId: primaryStaff.id,
          reviewOwnerId: reviewOwnerStaff?.id,
          conflictStaffId: finalAssigneeStaff.id,
          reason: 'SELF_APPROVAL_PREVENTED',
          routedAt: new Date().toISOString()
        }
      };
    }
  }

  // 8. Lookup Governing SOP
  let sopTitle: string | undefined;
  let sopVersion: string | undefined = matchedRule.governing_sop_version || '1.0';
  if (matchedRule.governing_sop_id) {
    const liveSop = sopRepository.getSopById(matchedRule.governing_sop_id, workspaceId);
    if (liveSop) {
      sopTitle = liveSop.title;
      sopVersion = String(liveSop.version || matchedRule.governing_sop_version || '1.0');
    }
  }

  const routedAt = new Date().toISOString();
  const snapshot = {
    routingPolicyId: policy.id,
    routingPolicyVersion: policy.version,
    routingRuleId: matchedRule.id,
    governingSopId: matchedRule.governing_sop_id,
    governingSopVersion: sopVersion,
    governingSopTitle: sopTitle,
    departmentId: matchedRule.category,
    reviewRoleId: matchedRule.review_role_id || matchedRule.review_position_id,
    fulfillmentRoleId: matchedRule.primary_role_id || matchedRule.primary_position_id,
    originalReviewOwnerId: originalReviewOwnerStaff?.id || reviewOwnerStaff?.id,
    reviewCoveringStaffId: reviewCoveringStaff?.id,
    originalAssigneeId: originalAssigneeStaff?.id || primaryStaff.id,
    assigneeCoveringStaffId: assigneeCoveringStaff?.id,
    classificationConfidence: confidence,
    routingState: 'resolved',
    routingReasons: reasonCodes,
    routedAt,
    // Display & audit helpers
    channel: input.channel,
    primaryStaffId: primaryStaff.id,
    primaryStaffName: primaryStaff.fullName,
    finalAssigneeId: finalAssigneeStaff.id,
    finalAssigneeName: finalAssigneeStaff.fullName,
    reviewOwnerId: finalReviewOwner?.id,
    reviewOwnerName: finalReviewOwner?.fullName,
    coveringStaffId: assigneeCoveringStaff?.id,
    originalStaffId: originalAssigneeStaff?.id,
    slaHours: matchedRule.sla_hours,
    slaDisplay: matchedRule.sla_display
  };

  return {
    routingState: 'resolved',
    routingPolicyId: policy.id,
    routingPolicyVersion: policy.version,
    routingRuleId: matchedRule.id,
    departmentId: matchedRule.category,
    primaryRoleId: matchedRule.primary_role_id,
    reviewRoleId: matchedRule.review_role_id,
    fulfillmentRoleId: matchedRule.primary_role_id,
    assigneeStaffId: finalAssigneeStaff.id,
    assigneeName: finalAssigneeStaff.fullName,
    assigneeRole: finalAssigneeStaff.title,
    originalAssigneeId: originalAssigneeStaff?.id || primaryStaff.id,
    originalAssigneeName: originalAssigneeStaff?.fullName || primaryStaff.fullName,
    assigneeCoveringStaffId: assigneeCoveringStaff?.id,
    assigneeCoveringStaffName: assigneeCoveringStaff?.fullName,
    reviewOwnerStaffId: finalReviewOwner?.id,
    reviewOwnerName: finalReviewOwner?.fullName,
    reviewOwnerRole: finalReviewOwner?.title,
    originalReviewOwnerId: originalReviewOwnerStaff?.id || reviewOwnerStaff?.id,
    originalReviewOwnerName: originalReviewOwnerStaff?.fullName || reviewOwnerStaff?.fullName,
    reviewCoveringStaffId: reviewCoveringStaff?.id,
    reviewCoveringStaffName: reviewCoveringStaff?.fullName,
    governingSopId: matchedRule.governing_sop_id,
    governingSopVersion: sopVersion,
    governingSopTitle: sopTitle,
    matchedRuleId: matchedRule.id,
    ruleVersion: policy.version,
    confidence,
    reasonCodes,
    coveringStaffId: assigneeCoveringStaff?.id,
    coveringStaffName: assigneeCoveringStaff?.fullName,
    originalStaffId: originalAssigneeStaff?.id,
    originalStaffName: originalAssigneeStaff?.fullName,
    slaHours: matchedRule.sla_hours,
    slaDisplay: matchedRule.sla_display,
    escalationPolicyId: matchedRule.escalation_policy_id,
    routedAt,
    snapshot
  };
}

export const canonicalTaskRoutingService = {
  /**
   * Resolves routing for an incoming request or task according to published policies.
   */
  async resolveRouting(input: TaskRoutingInput): Promise<TaskRoutingDecision> {
    const workspaceId = input.workspaceId || 'ws_wilmington';

    // 1. Fetch published routing policy (never auto-publishes an active policy on resolution)
    const publishedData = await orgChartRepository.getPublishedPolicy(workspaceId);
    return evaluateRoutingDecision(input, publishedData);
  },

  /**
   * Synchronously resolves routing for an incoming request or task according to published policies.
   */
  resolveRoutingSync(input: TaskRoutingInput): TaskRoutingDecision {
    const workspaceId = input.workspaceId || 'ws_wilmington';
    const publishedData = orgChartRepository.getPublishedPolicySync(workspaceId);
    return evaluateRoutingDecision(input, publishedData);
  },

  /**
   * Helper to record the routing activity event in the canonical ledger.
   */
  async recordRoutingAudit(
    workspaceId: string,
    targetId: { taskId?: string; requestId?: string; callId?: string },
    decision: TaskRoutingDecision,
    channel: string
  ): Promise<void> {
    try {
      const isTriage = decision.routingState !== 'resolved';
      const eventType = isTriage ? 'task.created' : 'task.assigned';
      
      const humanSummary = isTriage
        ? `⚠️ Routing Triage Required: ${decision.triageReason || 'Manager review needed.'}`
        : `✓ Routed via ${decision.governingSopTitle ? `"${decision.governingSopTitle}" (v${decision.governingSopVersion})` : 'Published Role Map'}: Assigned to ${decision.assigneeName}${decision.coveringStaffName ? ` (Covering for ${decision.originalStaffName})` : ''} • Review: ${decision.reviewOwnerName || 'Manager Queue'}`;

      const idempotencyKey = `act_route_${targetId.taskId || targetId.requestId || targetId.callId || Date.now()}_${decision.routingState}`;

      await recordActivityEvent({
        workspaceId,
        requestId: targetId.requestId || 'req_auto_routed',
        taskId: targetId.taskId,
        callId: targetId.callId,
        eventType,
        actorType: 'system',
        actorId: 'sys_canonical_routing_engine',
        actorDisplayName: 'Canonical Routing Authority',
        channel: (['phone', 'email', 'web', 'manual'].includes(channel) ? channel : 'internal') as any,
        direction: 'internal',
        communicationStatus: 'delivered',
        summary: humanSummary,
        metadata: {
          ...decision.snapshot,
          decisionState: decision.routingState,
          reasonCodes: decision.reasonCodes,
          triageReason: decision.triageReason,
          governingSopId: decision.governingSopId,
          governingSopVersion: decision.governingSopVersion
        },
        idempotencyKey
      });
    } catch (err) {
      console.warn('[CanonicalTaskRouting] Non-blocking activity audit record failed:', err);
    }
  }
};
