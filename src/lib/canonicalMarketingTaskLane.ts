export type CanonicalPipelineLaneId = 'request_received' | 'assigned' | 'in_progress' | 'agent_review' | 'revisions' | 'approved' | 'with_vendor';

export function getCanonicalLaneForTask(task: {
  status?: string;
  reviewState?: string;
  assignedTo?: string;
  isArchived?: boolean;
}): CanonicalPipelineLaneId | 'archived' | 'legacy_unreconciled' {
  if (task.isArchived || task.status === 'archived') return 'archived';
  if (task.status === 'completed') return 'approved';
  if (task.status === 'approved' || task.reviewState === 'approved') return 'agent_review';
  if (task.status === 'agent_review' || task.reviewState === 'awaiting_review') return 'agent_review';
  if (task.status === 'revisions' || task.reviewState === 'revisions_requested') return 'revisions';
  if (task.status === 'with_vendor') return 'with_vendor';
  if (task.status === 'in_progress') return 'in_progress';
  if (task.status === 'assigned' || task.status === 'ready_for_review') return 'assigned';
  if (task.status === 'request_received' || task.status === 'needs_info' || (!task.assignedTo && !task.status)) return 'request_received';
  return 'legacy_unreconciled';
}
