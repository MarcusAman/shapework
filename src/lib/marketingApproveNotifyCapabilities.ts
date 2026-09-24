/**
 * Marketing Approve & Notify role gate (Feature Lab / Blueprint ADR).
 *
 * - assignee: upload / submit-to-reviewer only — NEVER Approve & Notify
 * - reviewer: request-revisions · Approve & Notify
 * - assignee+reviewer same person → reviewer caps
 * - Do not key off status labels like "In production" alone
 */

export type MarketingGateActor = {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  role?: string | null;
};

export type MarketingGateTask = {
  assignedToId?: string | null;
  assignedTo?: string | null;
  reviewOwnerId?: string | null;
  reviewOwnerName?: string | null;
  reviewerId?: string | null;
  status?: string | null;
  reviewState?: string | null;
};

export type MarketingApproveNotifyCapabilities = {
  isAssignee: boolean;
  isReviewer: boolean;
  /** Upload finished asset */
  canUpload: boolean;
  /** Producer handoff CTA */
  canSubmitToReviewer: boolean;
  /** Request revisions */
  canRequestRevisions: boolean;
  /** Approve & Notify Agent */
  canApproveAndNotify: boolean;
  /** Drawer Next / primary CTA hint */
  primaryCta: 'upload' | 'submit_to_reviewer' | 'approve_and_notify' | 'none';
};

function norm(value?: string | null): string {
  return String(value || '').toLowerCase().trim();
}

export function resolveTaskReviewerId(task: MarketingGateTask): string {
  return norm(task.reviewerId || task.reviewOwnerId);
}

export function resolveTaskReviewerName(task: MarketingGateTask): string {
  return norm(task.reviewOwnerName);
}

export function actorIsTaskReviewer(actor: MarketingGateActor, task: MarketingGateTask): boolean {
  const reviewerId = resolveTaskReviewerId(task);
  const actorId = norm(actor.id);
  if (reviewerId && actorId && reviewerId === actorId) return true;
  const reviewerName = resolveTaskReviewerName(task);
  const actorName = norm(actor.name);
  if (reviewerName && actorName && reviewerName === actorName) return true;
  return false;
}

export function actorIsTaskAssignee(actor: MarketingGateActor, task: MarketingGateTask): boolean {
  const assigneeId = norm(task.assignedToId);
  const actorId = norm(actor.id);
  if (assigneeId && actorId && assigneeId === actorId) return true;
  const assigneeName = norm(task.assignedTo);
  const actorName = norm(actor.name);
  if (assigneeName && actorName && assigneeName === actorName) return true;
  return false;
}

/**
 * Capability helper keyed on role relative to the task (not global director title alone).
 * Assignee+reviewer same person inherits reviewer caps (Approve & Notify, not submit-to-self).
 */
export function resolveMarketingApproveNotifyCapabilities(
  actor: MarketingGateActor | null | undefined,
  task: MarketingGateTask | null | undefined
): MarketingApproveNotifyCapabilities {
  if (!actor || !task) {
    return {
      isAssignee: false,
      isReviewer: false,
      canUpload: false,
      canSubmitToReviewer: false,
      canRequestRevisions: false,
      canApproveAndNotify: false,
      primaryCta: 'none',
    };
  }

  const isReviewer = actorIsTaskReviewer(actor, task);
  const isAssignee = actorIsTaskAssignee(actor, task);

  // Reviewer caps when same person is both assignee and reviewer.
  const canApproveAndNotify = isReviewer;
  const canRequestRevisions = isReviewer;
  const canSubmitToReviewer = isAssignee && !isReviewer;
  const canUpload = isAssignee || isReviewer;

  let primaryCta: MarketingApproveNotifyCapabilities['primaryCta'] = 'none';
  if (canApproveAndNotify) primaryCta = 'approve_and_notify';
  else if (canSubmitToReviewer) primaryCta = 'submit_to_reviewer';
  else if (canUpload) primaryCta = 'upload';

  return {
    isAssignee,
    isReviewer,
    canUpload,
    canSubmitToReviewer,
    canRequestRevisions,
    canApproveAndNotify,
    primaryCta,
  };
}

/** Server-facing gate: only the task reviewer may approve/notify. */
export function assertActorIsTaskReviewerForApproveNotify(
  actor: MarketingGateActor | null | undefined,
  task: MarketingGateTask | null | undefined
): { allowed: boolean; errorCode?: string; reason?: string } {
  if (!actor) {
    return {
      allowed: false,
      errorCode: 'UNAUTHENTICATED',
      reason: 'Authentication required for Approve & Notify.',
    };
  }
  if (!task) {
    return {
      allowed: false,
      errorCode: 'TASK_NOT_FOUND',
      reason: 'Task not found.',
    };
  }
  const caps = resolveMarketingApproveNotifyCapabilities(actor, task);
  if (!caps.canApproveAndNotify) {
    return {
      allowed: false,
      errorCode: 'FORBIDDEN_NOT_TASK_REVIEWER',
      reason:
        'Approve & Notify refused: only the task reviewer may approve and notify the agent.',
    };
  }
  return { allowed: true };
}
