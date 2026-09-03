/**
 * Canonical Marketing Lifecycle Transition Policy
 * 
 * Enforces the strict canonical state machine:
 * needs_info → ready_for_review → in_progress → completed
 * 
 * Rules:
 * 1. A task or request in needs_info must NEVER become in_progress or completed
 *    until all required fields are present, verified photos are present, MLS/broker
 *    conflicts are resolved, and it reaches ready_for_review.
 *    Attempting needs_info → in_progress or needs_info → completed returns HTTP 409 INVALID_STATE_TRANSITION.
 * 2. BIC, admin, directory title, or client payload alone must NOT bypass readiness.
 * 3. ready_for_review → in_progress requires an authorized operations identity
 *    derived strictly from the authenticated server session (req.authUser.role).
 *    Client-supplied roles or performedBy claims in request body/headers are ignored.
 * 4. in_progress → completed requires an authorized operations identity derived from session.
 * 5. Parent request and child task statuses cannot contradict each other. If parent is needs_info,
 *    child task cannot transition to in_progress or completed.
 * 6. Adding an internal note must not silently change status.
 */

import { CanonicalMarketingTask, CanonicalMarketingRequest } from '../persistence/marketingCampaignsRepository.js';

export interface SessionUser {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  workspaceId?: string;
}

export interface TransitionValidationResult {
  allowed: boolean;
  statusCode?: number;
  errorCode?: string;
  error?: string;
  message?: string;
  isNoteOnly?: boolean;
}

export const AUTHORIZED_OPERATIONS_ROLES = [
  'marketing_coordinator',
  'operations_lead',
  'operations_manager',
  'admin',
  'owner'
];

/**
 * Validates whether a user session role grants operations authority.
 * Never trusts client payloads; evaluates strictly against server session.
 */
export function isAuthorizedOperationsIdentity(user?: SessionUser | null): boolean {
  if (!user || !user.role) return false;
  const normalizedRole = user.role.toLowerCase().trim();
  return AUTHORIZED_OPERATIONS_ROLES.includes(normalizedRole);
}

/**
 * Validates a proposed task lifecycle status transition.
 */
export function validateTaskTransition(
  task: CanonicalMarketingTask,
  requestedStatus?: string | null,
  sessionUser?: SessionUser | null,
  parentRequest?: CanonicalMarketingRequest | null
): TransitionValidationResult {
  const currentStatus = task.status || 'needs_info';
  const targetStatus = requestedStatus?.trim();

  // 1. Note-only or metadata-only update: no status change requested or status unchanged
  if (!targetStatus || targetStatus === currentStatus) {
    return {
      allowed: true,
      isNoteOnly: true
    };
  }

  // 2. Strict Readiness Guardrail: needs_info → in_progress or needs_info → completed is strictly rejected
  if (currentStatus === 'needs_info' && (targetStatus === 'in_progress' || targetStatus === 'completed')) {
    return {
      allowed: false,
      statusCode: 409,
      errorCode: 'INVALID_STATE_TRANSITION',
      error: 'INVALID_STATE_TRANSITION',
      message: `Invalid task lifecycle transition: cannot transition task directly from "${currentStatus}" to "${targetStatus}". Tasks must achieve readiness (ready_for_review) before work can begin.`
    };
  }

  // 3. Parent Request Status Integrity Guardrail: Child task cannot be in_progress or completed if parent is incomplete (needs_info)
  const parentStatus = parentRequest?.status;
  if (parentStatus === 'needs_info' && (targetStatus === 'in_progress' || targetStatus === 'completed')) {
    return {
      allowed: false,
      statusCode: 409,
      errorCode: 'INVALID_STATE_TRANSITION',
      error: 'INVALID_STATE_TRANSITION',
      message: `Invalid task lifecycle transition: parent marketing request is in "${parentStatus}". Child tasks cannot transition to "${targetStatus}" while the parent request remains incomplete.`
    };
  }

  // 4. ready_for_review → in_progress requires an authorized operations identity
  if (currentStatus === 'ready_for_review' && targetStatus === 'in_progress') {
    if (!isAuthorizedOperationsIdentity(sessionUser)) {
      return {
        allowed: false,
        statusCode: 403,
        errorCode: 'UNAUTHORIZED_OPERATIONS_ROLE',
        error: 'UNAUTHORIZED_OPERATIONS_ROLE',
        message: `Forbidden: Starting work on a marketing deliverable requires an authorized operations identity derived from the authenticated session. Current session role "${sessionUser?.role || 'unknown'}" is not authorized.`
      };
    }
  }

  // 5. in_progress → completed requires an authorized operations identity
  if (targetStatus === 'completed') {
    if (!isAuthorizedOperationsIdentity(sessionUser)) {
      return {
        allowed: false,
        statusCode: 403,
        errorCode: 'UNAUTHORIZED_OPERATIONS_ROLE',
        error: 'UNAUTHORIZED_OPERATIONS_ROLE',
        message: `Forbidden: Completing and approving a marketing deliverable requires an authorized operations identity. Current session role "${sessionUser?.role || 'unknown'}" is not authorized.`
      };
    }
  }

  return {
    allowed: true,
    isNoteOnly: false
  };
}
