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
import { resolveStaffMember, getAllStaffMembers } from '../persistence/operationsDirectoryRepository.js';

export interface SessionUser {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  workspaceId?: string;
}

/**
 * Identifies the producer/author of a task's proof from its submission history.
 * Retains historical submission attribution even if the task is subsequently reassigned.
 */
export function getProofAuthorIdentity(task: CanonicalMarketingTask): {
  authorId?: string;
  authorName?: string;
} {
  // 1. Check current proof version in proofHistory
  if (task.proofHistory && task.proofHistory.length > 0) {
    const targetVersion = task.proofVersion || 1;
    const matchedProof = task.proofHistory.find(p => p.version === targetVersion) || 
                         task.proofHistory[task.proofHistory.length - 1];
    if (matchedProof) {
      return {
        authorId: matchedProof.uploadedById,
        authorName: matchedProof.uploadedBy
      };
    }
  }

  // 2. Check proofs array
  if (task.proofs && task.proofs.length > 0) {
    const lastProof = task.proofs[task.proofs.length - 1];
    if (lastProof.uploadedBy) {
      return { authorName: lastProof.uploadedBy };
    }
  }

  // 3. Fallback to assigned producer
  return {
    authorId: task.assignedToId,
    authorName: task.assignedTo
  };
}

/**
 * Validates that an approving reviewer is NOT the person who produced or submitted the proof.
 * Uses canonical staff directory resolution across IDs, emails, and names.
 */
export function validateSelfApprovalSafety(
  task: CanonicalMarketingTask,
  sessionUser?: SessionUser | null
): { allowed: boolean; reason?: string; errorCode?: string } {
  if (!sessionUser) {
    return {
      allowed: false,
      errorCode: 'UNAUTHENTICATED',
      reason: 'Authentication required for proof approval.'
    };
  }

  const wsId = task.workspaceId || 'ws_wilmington';
  const allStaff = getAllStaffMembers();

  // 1. Resolve reviewer canonical staff profile
  const reviewerStaff = (sessionUser.id ? resolveStaffMember(sessionUser.id, wsId, allStaff) : undefined) ||
                        (sessionUser.email ? resolveStaffMember(sessionUser.email, wsId, allStaff) : undefined) ||
                        (sessionUser.name ? resolveStaffMember(sessionUser.name, wsId, allStaff) : undefined);

  // 2. Resolve author canonical staff profile from submission history
  const authorInfo = getProofAuthorIdentity(task);
  const authorStaff = (authorInfo.authorId ? resolveStaffMember(authorInfo.authorId, wsId, allStaff) : undefined) ||
                      (authorInfo.authorName ? resolveStaffMember(authorInfo.authorName, wsId, allStaff) : undefined);

  // 3. Canonical directory ID collision
  if (reviewerStaff && authorStaff && reviewerStaff.id === authorStaff.id) {
    return {
      allowed: false,
      errorCode: 'FORBIDDEN_SELF_APPROVAL',
      reason: `Self-approval rejected: Staff member "${reviewerStaff.fullName}" (${reviewerStaff.id}) produced or submitted this proof and cannot approve their own work.`
    };
  }

  // 4. Raw user ID collision
  if (sessionUser.id && authorInfo.authorId && sessionUser.id.toLowerCase() === authorInfo.authorId.toLowerCase()) {
    return {
      allowed: false,
      errorCode: 'FORBIDDEN_SELF_APPROVAL',
      reason: `Self-approval rejected: User ID "${sessionUser.id}" submitted this proof and cannot approve their own work.`
    };
  }

  // 5. Name collision
  if (sessionUser.name && authorInfo.authorName && sessionUser.name.toLowerCase().trim() === authorInfo.authorName.toLowerCase().trim()) {
    return {
      allowed: false,
      errorCode: 'FORBIDDEN_SELF_APPROVAL',
      reason: `Self-approval rejected: "${sessionUser.name}" submitted this proof and cannot approve their own work.`
    };
  }

  // 6. Check assigned producer if task is awaiting review
  const assignedStaff = (task.assignedToId ? resolveStaffMember(task.assignedToId, wsId, allStaff) : undefined) ||
                        (task.assignedTo ? resolveStaffMember(task.assignedTo, wsId, allStaff) : undefined);

  if (reviewerStaff && assignedStaff && reviewerStaff.id === assignedStaff.id && task.reviewState === 'awaiting_review') {
    return {
      allowed: false,
      errorCode: 'FORBIDDEN_SELF_APPROVAL',
      reason: `Self-approval rejected: Assigned producer "${reviewerStaff.fullName}" cannot approve their own assigned deliverables.`
    };
  }

  return { allowed: true };
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

  // 1b. Completed tasks cannot be reopened by status updates
  if (currentStatus === 'completed' && targetStatus !== 'completed') {
    return {
      allowed: false,
      statusCode: 409,
      errorCode: 'COMPLETED_TASK_LOCKED',
      error: 'COMPLETED_TASK_LOCKED',
      message: `Invalid task lifecycle transition: completed tasks cannot be reopened by status updates.`
    };
  }

  // 2. Strict Readiness Guardrail: needs_info cannot bypass ready_for_review
  if (currentStatus === 'needs_info' && (
    targetStatus === 'in_progress' || 
    targetStatus === 'completed' || 
    targetStatus === 'assigned' || 
    targetStatus === 'agent_review' ||
    targetStatus === 'proof_submitted' ||
    targetStatus === 'awaiting_review'
  )) {
    return {
      allowed: false,
      statusCode: 409,
      errorCode: 'INVALID_STATE_TRANSITION',
      error: 'INVALID_STATE_TRANSITION',
      message: `Invalid task lifecycle transition: cannot transition task directly from "${currentStatus}" to "${targetStatus}". Tasks must achieve readiness (ready_for_review) before work can be assigned or started.`
    };
  }

  // 2b. Readiness to review guardrail: ready_for_review cannot jump directly to proof review without in_progress
  if (currentStatus === 'ready_for_review' && (
    targetStatus === 'agent_review' || 
    targetStatus === 'proof_submitted' || 
    targetStatus === 'awaiting_review'
  )) {
    return {
      allowed: false,
      statusCode: 409,
      errorCode: 'INVALID_STATE_TRANSITION',
      error: 'INVALID_STATE_TRANSITION',
      message: `Invalid task lifecycle transition: cannot transition task directly from "${currentStatus}" to "${targetStatus}". Work must be started ("in_progress") and proof submitted before review.`
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

  // 5. in_progress → completed requires an authorized operations identity and forbids self-approval
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

    // Strict self-approval guardrail
    const selfApprovalCheck = validateSelfApprovalSafety(task, sessionUser);
    if (!selfApprovalCheck.allowed) {
      return {
        allowed: false,
        statusCode: 403,
        errorCode: selfApprovalCheck.errorCode || 'FORBIDDEN_SELF_APPROVAL',
        error: selfApprovalCheck.errorCode || 'FORBIDDEN_SELF_APPROVAL',
        message: selfApprovalCheck.reason
      };
    }
  }

  return {
    allowed: true,
    isNoteOnly: false
  };
}
