import { Action, Delivery, ShapeworkJobStep } from './runtimeTypes.js';
import { createOutcomeForStep } from './outcomeService.js';

let onStepCompletedCallback: ((jobId: string) => void) | null = null;

export function setOnStepCompleted(cb: (jobId: string) => void) {
  onStepCompletedCallback = cb;
}

export function dispatchActionForStep(dbState: any, step: ShapeworkJobStep, approvalId?: string): Action {
  if (!dbState.actions) dbState.actions = [];
  if (!dbState.deliveries) dbState.deliveries = [];

  let actionType: Action['action_type'] = 'internal_route';
  if (step.channel === 'email') actionType = 'send_email';
  else if (step.channel === 'sms') actionType = 'send_sms';
  else if (step.channel === 'action_link') actionType = 'create_action_link';
  else if (step.channel === 'webhook') actionType = 'dispatch_webhook';
  else if (step.channel === 'source_update') actionType = 'source_update';
  else if (step.channel === 'voice') actionType = 'voice_call';

  const action: Action = {
    id: `act_${Math.random().toString(36).substring(2, 11)}`,
    workspace_id: step.workspace_id,
    job_id: step.job_id,
    step_id: step.id,
    approval_id: approvalId,
    action_type: actionType,
    channel: step.channel,
    recipient_role: step.assigned_role,
    recipient_display: step.assigned_role === 'system' ? 'Automation Service' : 'Steve Schram',
    status: 'queued',
    provider: 'Shapework Headless Dispatcher',
    provider_ref_masked: 'ref_head_stub_xxxx',
    safe_payload_summary: step.safe_payload_summary,
    created_at: new Date().toISOString()
  };

  dbState.actions.push(action);

  // Dispatch logic (simulated stubs)
  setTimeout(() => {
    action.status = 'dispatched';
    action.dispatched_at = new Date().toISOString();

    // Create a delivery log
    const delivery: Delivery = {
      id: `del_${Math.random().toString(36).substring(2, 11)}`,
      workspace_id: action.workspace_id,
      action_id: action.id,
      channel: action.channel,
      provider: action.provider,
      delivery_status: 'delivered',
      attempt_count: 1,
      last_attempt_at: new Date().toISOString(),
      safe_provider_response_summary: '{"status": 200, "message": "Dispatched successfully through headless mock channel."}',
      created_at: new Date().toISOString()
    };
    dbState.deliveries.push(delivery);

    action.status = 'completed';
    action.completed_at = new Date().toISOString();

    // Complete the step and trigger outcome
    step.status = 'completed';
    step.updated_at = new Date().toISOString();

    createOutcomeForStep(dbState, step, action.id);

    if (onStepCompletedCallback) {
      onStepCompletedCallback(step.job_id);
    }
  }, 100);

  return action;
}
