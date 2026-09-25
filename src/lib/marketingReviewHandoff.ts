import { resolveCanonicalStaffMember } from '../services/canonicalRoster';

export interface MarketingReviewHandoffTask {
  workspaceId?: string;
  status?: string;
  reviewState?: string;
  isArchived?: boolean;
  assignedTo?: string;
  assignedToName?: string;
  assignedToId?: string;
  reviewOwnerId?: string;
  reviewOwnerName?: string;
  reviewOwner?: string;
}

/** Display the review handoff without changing the producer's durable assignment. */
export function getMarketingReviewHandoff(task: MarketingReviewHandoffTask) {
  if (task.isArchived || ['archived', 'completed', 'approved', 'revisions', 'with_vendor'].includes(task.status || '')) return null;
  const awaitingReview = task.reviewState === 'awaiting_review' || (
    !task.reviewState && ['agent_review', 'awaiting_review', 'ready_for_review'].includes(task.status || '')
  );
  if (!awaitingReview) return null;

  const workspaceId = task.workspaceId || 'ws_wilmington';
  const reviewer = resolveCanonicalStaffMember(task.reviewOwnerId, workspaceId)
    || resolveCanonicalStaffMember(task.reviewOwnerName || task.reviewOwner, workspaceId);
  const producer = resolveCanonicalStaffMember(task.assignedToId, workspaceId)
    || resolveCanonicalStaffMember(task.assignedTo || task.assignedToName, workspaceId);
  return {
    reviewerName: reviewer?.displayName || task.reviewOwnerName || task.reviewOwner || 'Unassigned reviewer',
    producerName: producer?.displayName || task.assignedTo || task.assignedToName || 'Unassigned',
  };
}
