import { Outcome, Receipt, ShapeworkJobStep } from './runtimeTypes.js';
import { createOwnerBriefItem } from './ownerBriefService.js';

export function createOutcomeForStep(dbState: any, step: ShapeworkJobStep, actionId: string): Outcome {
  if (!dbState.outcomes) dbState.outcomes = [];
  if (!dbState.receipts) dbState.receipts = [];
  if (!dbState.shapeworkOutputs) dbState.shapeworkOutputs = [];

  const outcomeId = `outc_${Math.random().toString(36).substring(2, 11)}`;
  const job = (dbState.shapeworkJobs || []).find((j: any) => j.id === step.job_id);

  let title = 'Step outcome recorded';
  let summary = `Completed step: ${step.title}`;
  let followUpRequired = false;
  let ownerBriefEligible = false;

  if (job) {
    if (job.workflow_key === 'google_review_dispatch') {
      title = 'Google review invitation sent';
      summary = 'Successfully dispatched Google Review invitation to Bruce Wayne at bruce.wayne@waynecorp.com.';
      ownerBriefEligible = true;
    } else if (job.workflow_key === 'compliance_chase') {
      title = 'Compliance nudge dispatched';
      summary = 'Compliance nudge email sent to agent@nestrealty.com for outstanding disclosures.';
      followUpRequired = true;
    } else if (job.workflow_key === 'ryan_shield_routing') {
      title = 'Maintenance query deflected';
      summary = 'Intercepted facilities/supplies query from office agent and routed to Steve Schram.';
      ownerBriefEligible = true;
    } else if (job.workflow_key === 'office_readiness') {
      title = 'Inventory verification logged';
      summary = 'Signage and lockbox reserves confirmed and courier coordinate SMS dispatched.';
      ownerBriefEligible = true;
    } else if (job.workflow_key === 'marketing_request') {
      title = 'Intake ledger generated';
      summary = 'Listing package check complete and checklist file routed to design desk.';
      followUpRequired = true;
    }
  }

  const outcome: Outcome = {
    id: outcomeId,
    workspace_id: step.workspace_id,
    job_id: step.job_id,
    step_id: step.id,
    action_id: actionId,
    outcome_type: step.channel,
    title,
    summary,
    follow_up_required: followUpRequired,
    owner_brief_eligible: ownerBriefEligible,
    created_at: new Date().toISOString()
  };

  dbState.outcomes.push(outcome);

  // Check if all steps in this job are completed
  const jobSteps = (dbState.shapeworkJobSteps || []).filter((s: any) => s.job_id === step.job_id);
  const remainingSteps = jobSteps.filter((s: any) => s.status !== 'completed' && s.status !== 'failed' && s.status !== 'skipped');

  if (remainingSteps.length === 0 && job && job.status !== 'completed') {
    // Complete the job!
    job.status = 'completed';
    job.completed_at = new Date().toISOString();
    job.current_step = 'All steps completed';

    // Create a customer receipt
    const receiptId = `rec_${Math.random().toString(36).substring(2, 11)}`;
    const receipt: Receipt = {
      id: receiptId,
      workspace_id: job.workspace_id,
      job_id: job.id,
      outcome_id: outcome.id,
      title,
      summary,
      action_taken: outcome.title,
      completed_time: new Date().toISOString(),
      source_workflow: job.workflow_name,
      owner_brief_updated: ownerBriefEligible,
      follow_up_needed: followUpRequired,
      created_at: new Date().toISOString()
    };

    dbState.receipts.unshift(receipt);

    // Keep dbState.shapeworkOutputs in sync for client backward-compatibility
    dbState.shapeworkOutputs.unshift({
      id: receipt.id,
      workspace_id: receipt.workspace_id,
      job_id: receipt.job_id,
      output_type: step.channel === 'internal_route' ? 'internal_route' : step.channel === 'sms' ? 'api' : step.channel,
      title: receipt.title,
      summary: receipt.summary,
      action_taken: receipt.action_taken,
      recipient: step.assigned_role === 'system' ? 'System Service' : 'Steve Schram',
      outcome: receipt.summary,
      follow_up_needed: receipt.follow_up_needed,
      owner_brief_updated: receipt.owner_brief_updated,
      created_at: receipt.created_at
    });

    // If eligible, surface as a win / completed work item in the Owner Brief!
    if (ownerBriefEligible || job.owner_worthy) {
      createOwnerBriefItem(dbState, {
        workspace_id: job.workspace_id,
        source_type: 'receipt',
        source_id: receipt.id,
        title: receipt.title,
        summary: receipt.summary,
        category: 'completed_work',
        priority: 'medium'
      });
    }
  }

  return outcome;
}
