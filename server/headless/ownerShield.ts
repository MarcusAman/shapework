export type OwnerShieldMetrics = {
  routedToStaffCount: number;
  escalatedToOwnerCount: number;
  heldForDigestCount: number;
  needsOwnerDecisionCount: number;
};

export type OwnerShieldDecision = {
  id: string;
  workItemId: string;
  decision: 'deflected' | 'escalated' | 'held_for_digest' | 'needs_owner_decision';
  reason: string;
  rulesTriggered: string[];
  confidence: number;
  humanReviewRequired: boolean;
  createdAt: string;
  entityRef?: string;
};

export function runOwnerShieldForWorkItem(dbState: any, workItem: any): OwnerShieldDecision {
  const decisionId = `osd_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
  
  let decision: OwnerShieldDecision['decision'] = 'needs_owner_decision';
  let reason = 'Default routing: item remains in owner review queue.';
  let rulesTriggered: string[] = [];
  let confidence = 1.0;
  let routedToRole: string | undefined;
  let humanReviewRequired = false;

  // Rule 1: Owner assigned to low-priority task -> deflect to coordinator
  if (workItem.ownerRole === 'owner' && workItem.priority === 'low') {
    decision = 'deflected';
    reason = 'Deflected: Low-priority task routed away from broker owner.';
    rulesTriggered.push('owner_low_priority_deflect');
    routedToRole = 'operations_lead';
    workItem.ownerRole = 'operations_lead';
    confidence = 0.95;
  }
  // Rule 2: Routine office signage or marketing submission -> deflect
  else if (workItem.type === 'marketing' || workItem.type === 'office_signage') {
    decision = 'deflected';
    reason = `Deflected: Routine ${workItem.type} request routed directly to corresponding coordinator.`;
    rulesTriggered.push('routine_request_deflect');
    routedToRole = workItem.type === 'marketing' ? 'marketing_coordinator' : 'maintenance';
    workItem.ownerRole = routedToRole;
    confidence = 0.99;
  }
  // Rule 3: Overdue task with no backup owner -> escalate
  else if (workItem.status === 'overdue' && !workItem.backupOwner) {
    decision = 'escalated';
    reason = 'Escalated: High-risk overdue item with no active backup owner.';
    rulesTriggered.push('overdue_no_backup_escalate');
    confidence = 0.98;
    humanReviewRequired = true;
  }
  
  const shieldDecision: OwnerShieldDecision = {
    id: decisionId,
    workItemId: workItem.id,
    decision,
    reason,
    rulesTriggered,
    confidence,
    humanReviewRequired,
    createdAt: new Date().toISOString(),
    entityRef: workItem.dealId || workItem.listingId
  };

  if (!dbState.ownerShieldDecisions) dbState.ownerShieldDecisions = [];
  dbState.ownerShieldDecisions.push(shieldDecision);

  return shieldDecision;
}

export function evaluateOwnerShieldRules(dbState: any): OwnerShieldMetrics {
  // Initialize default seed metrics
  const metrics: OwnerShieldMetrics = {
    routedToStaffCount: 4,      
    escalatedToOwnerCount: 2,
    heldForDigestCount: 0,
    needsOwnerDecisionCount: 1
  };

  const workItems = dbState.workItems || [];
  const actionProposals = dbState.actionProposals || [];
  const attentionStates = dbState.attentionStates || [];

  // Evaluate baseline rules
  workItems.forEach((wi: any) => {
    if (wi.ownerRole === 'owner' && wi.priority === 'low') {
      metrics.routedToStaffCount++;
    }
    if (wi.status === 'overdue' && !wi.backupOwner) {
      metrics.escalatedToOwnerCount++;
    }
  });

  actionProposals.forEach((p: any) => {
    if (p.actionType === 'submit_marketing_request' || p.actionType === 'request_office_signage') {
      metrics.routedToStaffCount++;
    } else if (p.status === 'pending') {
      metrics.needsOwnerDecisionCount++;
    }
  });

  attentionStates.forEach((state: any) => {
    if (state.snoozeCount > 2 && state.priority === 'high') {
      metrics.escalatedToOwnerCount++;
    }
  });

  // Blend in persistent runtime decisions
  const decisions = dbState.ownerShieldDecisions || [];
  decisions.forEach((d: any) => {
    if (d.decision === 'deflected') metrics.routedToStaffCount++;
    if (d.decision === 'escalated') metrics.escalatedToOwnerCount++;
    if (d.decision === 'held_for_digest') metrics.heldForDigestCount++;
    if (d.decision === 'needs_owner_decision') metrics.needsOwnerDecisionCount++;
  });

  return metrics;
}
