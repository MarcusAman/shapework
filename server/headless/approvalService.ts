import { Approval } from './runtimeTypes.js';
import { dispatchActionForStep } from './actionDispatchService.js';
import { createOwnerBriefItem } from './ownerBriefService.js';

export function createApproval(dbState: any, params: Partial<Approval>): Approval {
  if (!dbState.approvals) dbState.approvals = [];

  const approval: Approval = {
    id: params.id || `appr_${Math.random().toString(36).substring(2, 11)}`,
    workspace_id: params.workspace_id || 'nest-realty-demo',
    job_id: params.job_id || '',
    step_id: params.step_id || '',
    approval_type: params.approval_type || 'action_dispatch_gate',
    title: params.title || 'Approve Action',
    summary: params.summary || 'Approval is required before dispatching this action.',
    recipient_role: params.recipient_role || 'operations_lead',
    recipient_display: params.recipient_display || 'Sarah Jenkins',
    channel: params.channel || 'email',
    draft_action_summary: params.draft_action_summary || '{}',
    risk_level: params.risk_level || 'low',
    what_could_go_wrong: params.what_could_go_wrong || 'None anticipated.',
    status: 'pending',
    created_at: new Date().toISOString()
  };

  dbState.approvals.unshift(approval);

  // Surface the pending approval in the Owner Brief as an owner_decision!
  createOwnerBriefItem(dbState, {
    workspace_id: approval.workspace_id,
    source_type: 'approval',
    source_id: approval.id,
    title: `Pending Approval: ${approval.title}`,
    summary: approval.summary,
    category: 'owner_decision',
    priority: approval.risk_level === 'critical' ? 'critical' : approval.risk_level === 'high' ? 'high' : 'medium'
  });

  return approval;
}

export function approveApproval(dbState: any, approvalId: string, approvedBy: string) {
  const approval = (dbState.approvals || []).find((a: any) => a.id === approvalId);
  if (!approval || approval.status !== 'pending') return;

  approval.status = 'approved';
  approval.approved_by = approvedBy;
  approval.approved_at = new Date().toISOString();

  // Find step and mark it approved
  const step = (dbState.shapeworkJobSteps || []).find((s: any) => s.id === approval.step_id);
  if (step) {
    step.status = 'dispatched';
    step.approved_by = approvedBy;
    step.approved_at = new Date().toISOString();
    step.updated_at = new Date().toISOString();

    // Trigger Action Dispatch
    dispatchActionForStep(dbState, step, approval.id);
  }

  // Remove the pending owner brief item or mark it resolved (if we want, or just delete it from active items)
  if (dbState.ownerBriefItems) {
    dbState.ownerBriefItems = dbState.ownerBriefItems.filter(
      (item: any) => !(item.source_type === 'approval' && item.source_id === approvalId)
    );
  }
}
