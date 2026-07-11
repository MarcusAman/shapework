import { Decision, Signal, ShapeworkJob, ShapeworkJobStep } from './runtimeTypes.js';
import { createApproval } from './approvalService.js';

export function createJobPlan(dbState: any, decision: Decision, signal: Signal): ShapeworkJob {
  if (!dbState.shapeworkJobs) dbState.shapeworkJobs = [];
  if (!dbState.shapeworkJobSteps) dbState.shapeworkJobSteps = [];

  const jobId = `job_${Math.random().toString(36).substring(2, 11)}`;
  const workflowKey = signal.signal_type;
  let workflowName = 'Custom Operation';
  let requestText = signal.title;
  let ownerWorthy = decision.owner_worthy;

  if (workflowKey === 'google_review_dispatch') {
    workflowName = 'Google Review Engine';
    requestText = 'Google Review Dispatch';
  } else if (workflowKey === 'compliance_chase') {
    workflowName = 'Compliance Chase Engine';
    requestText = 'Compliance Chase Engine';
  } else if (workflowKey === 'ryan_shield_routing') {
    workflowName = 'Owner Interruption Shield';
    requestText = 'Owner Interruption Shield';
  } else if (workflowKey === 'office_readiness') {
    workflowName = 'Sign / Lockbox / Office Readiness';
    requestText = 'Sign / Lockbox / Office Readiness';
  } else if (workflowKey === 'marketing_request') {
    workflowName = 'Marketing Request Intake';
    requestText = 'Marketing Request Intake';
  }

  const job: ShapeworkJob = {
    id: jobId,
    workspace_id: decision.workspace_id,
    signal_id: signal.id,
    decision_id: decision.id,
    requested_by: signal.source_type === 'manual' ? 'Owner (Sarah)' : 'Shapework Engine',
    request_text: requestText,
    workflow_key: workflowKey,
    workflow_name: workflowName,
    status: 'planned',
    source_context: signal.source_type,
    confidence: decision.confidence,
    current_step: 'Step 1: Planning',
    human_review_required: decision.human_review_required,
    owner_worthy: ownerWorthy,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  dbState.shapeworkJobs.push(job);

  // Plan steps
  const steps: Omit<ShapeworkJobStep, 'id' | 'created_at' | 'updated_at'>[] = [];

  if (workflowKey === 'google_review_dispatch') {
    steps.push(
      {
        workspace_id: decision.workspace_id,
        job_id: jobId,
        step_order: 1,
        title: 'Verify closing event confirmation',
        description: 'Verify dotloop transaction closed status and agent signatures.',
        channel: 'api',
        status: 'proposed',
        requires_approval: false,
        risk_level: 'low',
        assigned_role: 'system',
        safe_payload_summary: '{}'
      },
      {
        workspace_id: decision.workspace_id,
        job_id: jobId,
        step_order: 2,
        title: 'Locate buyer contact information',
        description: 'Fetch client contact profile from closing ledger.',
        channel: 'api',
        status: 'proposed',
        requires_approval: false,
        risk_level: 'low',
        assigned_role: 'system',
        safe_payload_summary: '{}'
      },
      {
        workspace_id: decision.workspace_id,
        job_id: jobId,
        step_order: 3,
        title: 'Draft Google Review invite email',
        description: 'Compose personalized invite copy with custom review link.',
        channel: 'api',
        status: 'proposed',
        requires_approval: false,
        risk_level: 'low',
        assigned_role: 'system',
        safe_payload_summary: '{}'
      },
      {
        workspace_id: decision.workspace_id,
        job_id: jobId,
        step_order: 4,
        title: 'Send Google Review link',
        description: 'Dispatch review invitation email directly to Bruce Wayne.',
        channel: 'email',
        status: 'proposed',
        requires_approval: false,
        risk_level: 'low',
        assigned_role: 'system',
        safe_payload_summary: '{"recipient": "bruce.wayne@waynecorp.com", "subject": "Tell us about your experience!"}'
      }
    );
  } else if (workflowKey === 'compliance_chase') {
    steps.push(
      {
        workspace_id: decision.workspace_id,
        job_id: jobId,
        step_order: 1,
        title: 'Audit transaction disclosures checklist',
        description: 'Audit dotloop checklist for transaction Arthur Pendragon (102 Pine Street).',
        channel: 'api',
        status: 'proposed',
        requires_approval: false,
        risk_level: 'low',
        assigned_role: 'system',
        safe_payload_summary: '{}'
      },
      {
        workspace_id: decision.workspace_id,
        job_id: jobId,
        step_order: 2,
        title: 'Locate missing Lead-Based Paint disclosure',
        description: 'Flag missing signature on mandatory Lead-Based Paint disclosure form.',
        channel: 'api',
        status: 'proposed',
        requires_approval: false,
        risk_level: 'low',
        assigned_role: 'system',
        safe_payload_summary: '{}'
      },
      {
        workspace_id: decision.workspace_id,
        job_id: jobId,
        step_order: 3,
        title: 'Draft compliance chase email to agent',
        description: 'Draft chaser alert to agent@nestrealty.com requesting Lead-Based Paint disclosure.',
        channel: 'email',
        status: 'proposed',
        requires_approval: true,
        risk_level: 'medium',
        assigned_role: 'compliance_partner',
        safe_payload_summary: '{"recipient": "agent@nestrealty.com", "subject": "Outstanding Disclosures: 102 Pine Street"}'
      }
    );
  } else if (workflowKey === 'ryan_shield_routing') {
    steps.push(
      {
        workspace_id: decision.workspace_id,
        job_id: jobId,
        step_order: 1,
        title: 'Intercept incoming inquiry',
        description: 'Read incoming maintenance inquiry email from office agent.',
        channel: 'email',
        status: 'proposed',
        requires_approval: false,
        risk_level: 'low',
        assigned_role: 'system',
        safe_payload_summary: '{}'
      },
      {
        workspace_id: decision.workspace_id,
        job_id: jobId,
        step_order: 2,
        title: 'Verify query deflection criteria',
        description: 'Verify query is routine office facilities question suitable for delegation.',
        channel: 'api',
        status: 'proposed',
        requires_approval: false,
        risk_level: 'low',
        assigned_role: 'system',
        safe_payload_summary: '{}'
      },
      {
        workspace_id: decision.workspace_id,
        job_id: jobId,
        step_order: 3,
        title: 'Route inquiry to Steve Schram',
        description: 'Auto-deflect supplies / signs query to Steve Schram via active routing rules.',
        channel: 'internal_route',
        status: 'proposed',
        requires_approval: false,
        risk_level: 'low',
        assigned_role: 'system',
        safe_payload_summary: '{"route_to": "Steve Schram", "action": "Delegate supplies request"}'
      }
    );
  } else if (workflowKey === 'office_readiness') {
    steps.push(
      {
        workspace_id: decision.workspace_id,
        job_id: jobId,
        step_order: 1,
        title: 'Verify lockbox and sign inventory levels',
        description: 'Query office inventory reserve levels for lockboxes and signposts.',
        channel: 'api',
        status: 'proposed',
        requires_approval: false,
        risk_level: 'low',
        assigned_role: 'system',
        safe_payload_summary: '{}'
      },
      {
        workspace_id: decision.workspace_id,
        job_id: jobId,
        step_order: 2,
        title: 'Dispatch physical lockbox courier delivery instructions',
        description: 'Send SMS coordination request to courier agent Steve Schram.',
        channel: 'sms',
        status: 'proposed',
        requires_approval: false,
        risk_level: 'low',
        assigned_role: 'system',
        safe_payload_summary: '{"recipient": "Steve Schram", "message": "Verify lockbox ready at 124 Ocean Blvd"}'
      }
    );
  } else if (workflowKey === 'marketing_request') {
    steps.push(
      {
        workspace_id: decision.workspace_id,
        job_id: jobId,
        step_order: 1,
        title: 'Validate package intake forms',
        description: 'Audit listing launch package form submission for high-res photo assets.',
        channel: 'api',
        status: 'proposed',
        requires_approval: false,
        risk_level: 'low',
        assigned_role: 'system',
        safe_payload_summary: '{}'
      },
      {
        workspace_id: decision.workspace_id,
        job_id: jobId,
        step_order: 2,
        title: 'Generate high-res photo download checklist',
        description: 'Download photos and bundle listing folder in shared storage.',
        channel: 'api',
        status: 'proposed',
        requires_approval: false,
        risk_level: 'low',
        assigned_role: 'system',
        safe_payload_summary: '{}'
      },
      {
        workspace_id: decision.workspace_id,
        job_id: jobId,
        step_order: 3,
        title: 'Route intake to design desk',
        description: 'Auto-assign design queue task to Melissa Gagliardi.',
        channel: 'internal_route',
        status: 'proposed',
        requires_approval: false,
        risk_level: 'low',
        assigned_role: 'system',
        safe_payload_summary: '{"route_to": "Melissa Gagliardi", "action": "Assign design task"}'
      }
    );
  } else {
    // Generic manual command
    steps.push(
      {
        workspace_id: decision.workspace_id,
        job_id: jobId,
        step_order: 1,
        title: 'Understand direct request',
        description: `Analyze manual owner command: "${signal.title}"`,
        channel: 'api',
        status: 'proposed',
        requires_approval: false,
        risk_level: 'low',
        assigned_role: 'system',
        safe_payload_summary: '{}'
      },
      {
        workspace_id: decision.workspace_id,
        job_id: jobId,
        step_order: 2,
        title: 'Process and dispatch operations action',
        description: 'Execute custom command sequence.',
        channel: 'internal_route',
        status: 'proposed',
        requires_approval: false,
        risk_level: 'low',
        assigned_role: 'system',
        safe_payload_summary: '{}'
      }
    );
  }

  // Create steps and create approvals for steps requiring approval
  steps.forEach(s => {
    const stepId = `step_${Math.random().toString(36).substring(2, 11)}`;
    const stepObj: ShapeworkJobStep = {
      ...s,
      id: stepId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    dbState.shapeworkJobSteps.push(stepObj);

    if (stepObj.requires_approval) {
      createApproval(dbState, {
        workspace_id: stepObj.workspace_id,
        job_id: stepObj.job_id,
        step_id: stepObj.id,
        approval_type: 'action_dispatch_gate',
        title: `Approve: ${stepObj.title}`,
        summary: stepObj.description,
        recipient_role: stepObj.assigned_role,
        recipient_display: 'Sarah Jenkins',
        channel: stepObj.channel,
        draft_action_summary: stepObj.safe_payload_summary,
        risk_level: stepObj.risk_level,
        what_could_go_wrong: 'Sending chaser email to agent might cause duplicate notifications if they already replied.'
      });
    }
  });

  return job;
}
