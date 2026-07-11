import { Signal, Decision } from './runtimeTypes.js';
import { createOwnerBriefItem } from './ownerBriefService.js';

export function evaluateSignal(dbState: any, signal: Signal): Decision {
  if (!dbState.decisions) dbState.decisions = [];

  let decisionType: Decision['decision_type'] = 'create_job';
  let confidence = 0.95;
  let ownerWorthy = false;
  let humanReviewRequired = false;
  const rulesTriggered: string[] = [];
  let rationaleSummary = 'Routed to standard workflow plan.';
  let assignedRole = 'system';

  // Apply triage rules
  if (signal.signal_type === 'ryan_shield_routing' || signal.title.toLowerCase().includes('ryan') || signal.summary.toLowerCase().includes('interruption')) {
    decisionType = 'deflect';
    rulesTriggered.push('RULE_RYAN_SHIELD_ROUTING');
    rationaleSummary = 'Interception rules matched: Query from staff agent deflected to steve@nestrealty.com (Steve Schram).';
    ownerWorthy = true; // Avoided owner interruption is owner-worthy!
  } else if (signal.signal_type === 'compliance_chase' || signal.title.toLowerCase().includes('compliance') || signal.summary.toLowerCase().includes('disclosures')) {
    decisionType = 'request_approval';
    rulesTriggered.push('RULE_COMPLIANCE_GATE_REQUIRED');
    rationaleSummary = 'Compliance chase workflow requires approval review due to email notification dispatch constraints.';
    humanReviewRequired = true;
    assignedRole = 'compliance_partner';
  } else if (signal.signal_type === 'google_review_dispatch' || signal.title.toLowerCase().includes('google review')) {
    decisionType = 'create_job';
    rulesTriggered.push('RULE_GOOGLE_REVIEW_AUTO_FLOW');
    rationaleSummary = 'Auto-matched dotloop closing trigger. Scheduled reviewer nudge.';
  } else if (signal.signal_type === 'office_readiness' || signal.title.toLowerCase().includes('readiness') || signal.title.toLowerCase().includes('sign')) {
    decisionType = 'create_job';
    rulesTriggered.push('RULE_OFFICE_READINESS_COURIER');
    rationaleSummary = 'Signage and lockbox courier coordination matched.';
  } else if (signal.signal_type === 'marketing_request' || signal.title.toLowerCase().includes('marketing')) {
    decisionType = 'create_job';
    rulesTriggered.push('RULE_MARKETING_INTAKE');
    rationaleSummary = 'Routed incoming package request to Design Desk checklists.';
  } else if (signal.source_type === 'manual') {
    decisionType = 'create_job';
    rulesTriggered.push('RULE_MANUAL_DISPATCH');
    rationaleSummary = 'Direct owner command triage. Spawning custom operating timeline.';
    ownerWorthy = true;
  }

  const decision: Decision = {
    id: `dec_${Math.random().toString(36).substring(2, 11)}`,
    workspace_id: signal.workspace_id,
    signal_id: signal.id,
    decision_type: decisionType,
    confidence,
    owner_worthy: ownerWorthy,
    human_review_required: humanReviewRequired,
    rules_triggered: rulesTriggered,
    rationale_summary: rationaleSummary,
    assigned_role: assignedRole,
    created_at: new Date().toISOString()
  };

  dbState.decisions.push(decision);

  // If the decision is a deflection, log it directly as an avoided interruption in the owner brief!
  if (decisionType === 'deflect') {
    createOwnerBriefItem(dbState, {
      workspace_id: signal.workspace_id,
      source_type: 'decision',
      source_id: decision.id,
      title: 'Owner Interruption Avoided',
      summary: `Deflected supplies / signage inquiry away from Ryan. Query was routed to Steve Schram.`,
      category: 'interruption_avoided',
      priority: 'low'
    });
  }

  return decision;
}
