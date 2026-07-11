export interface Signal {
  id: string;
  workspace_id: string;
  source_type: 'manual' | 'webhook' | 'email' | 'intake' | 'schedule' | 'integration' | 'demo';
  source_name: string;
  signal_type: string;
  title: string;
  summary: string;
  safe_payload_summary: string;
  raw_payload_ref?: string;
  linked_entity_type?: string;
  linked_entity_id?: string;
  received_at: string;
  created_at: string;
}

export interface Decision {
  id: string;
  workspace_id: string;
  signal_id: string;
  decision_type: 'route' | 'deflect' | 'escalate' | 'create_job' | 'request_approval' | 'ignore' | 'digest';
  confidence: number;
  owner_worthy: boolean;
  human_review_required: boolean;
  rules_triggered: string[];
  rationale_summary: string;
  assigned_role: string;
  created_at: string;
}

export interface ShapeworkJob {
  id: string;
  workspace_id: string;
  signal_id?: string;
  decision_id?: string;
  requested_by: string;
  request_text: string;
  workflow_key: string;
  workflow_name: string;
  status: 'planned' | 'running' | 'waiting_approval' | 'dispatched' | 'completed' | 'blocked' | 'failed' | 'dismissed';
  source_context?: string;
  confidence: number;
  current_step?: string;
  human_review_required: boolean;
  owner_worthy: boolean;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface ShapeworkJobStep {
  id: string;
  workspace_id: string;
  job_id: string;
  step_order: number;
  title: string;
  description: string;
  channel: 'api' | 'webhook' | 'email' | 'sms' | 'action_link' | 'voice' | 'gui_agent' | 'human_review' | 'source_update' | 'internal_route';
  status: 'proposed' | 'running' | 'waiting_approval' | 'dispatched' | 'completed' | 'blocked' | 'failed' | 'skipped';
  requires_approval: boolean;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  assigned_role: string;
  approved_by?: string;
  approved_at?: string;
  output_summary?: string;
  safe_payload_summary: string;
  created_at: string;
  updated_at: string;
}

export interface Approval {
  id: string;
  workspace_id: string;
  job_id: string;
  step_id: string;
  approval_type: string;
  title: string;
  summary: string;
  recipient_role: string;
  recipient_display: string;
  channel: string;
  draft_action_summary: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  what_could_go_wrong?: string;
  status: 'pending' | 'approved' | 'rejected' | 'dismissed' | 'expired';
  approved_by?: string;
  approved_at?: string;
  rejected_by?: string;
  rejected_at?: string;
  expires_at?: string;
  created_at: string;
}

export interface Action {
  id: string;
  workspace_id: string;
  job_id: string;
  step_id: string;
  approval_id?: string;
  action_type: 'send_email' | 'send_sms' | 'create_action_link' | 'dispatch_webhook' | 'source_update' | 'voice_call' | 'internal_route';
  channel: string;
  recipient_role: string;
  recipient_display: string;
  status: 'queued' | 'dispatched' | 'delivered' | 'failed' | 'completed';
  provider: string;
  provider_ref_masked?: string;
  safe_payload_summary: string;
  created_at: string;
  dispatched_at?: string;
  completed_at?: string;
}

export interface Delivery {
  id: string;
  workspace_id: string;
  action_id: string;
  channel: string;
  provider: string;
  delivery_status: 'queued' | 'in_transit' | 'delivered' | 'failed' | 'bounced';
  attempt_count: number;
  last_attempt_at?: string;
  failure_reason_summary?: string;
  safe_provider_response_summary?: string;
  created_at: string;
}

export interface Outcome {
  id: string;
  workspace_id: string;
  job_id: string;
  step_id: string;
  action_id?: string;
  outcome_type: string;
  title: string;
  summary: string;
  follow_up_required: boolean;
  follow_up_job_id?: string;
  owner_brief_eligible: boolean;
  created_at: string;
}

export interface Receipt {
  id: string;
  workspace_id: string;
  job_id: string;
  outcome_id: string;
  title: string;
  summary: string;
  action_taken: string;
  completed_time: string;
  source_workflow: string;
  owner_brief_updated: boolean;
  follow_up_needed: boolean;
  created_at: string;
}

export interface OwnerBriefItem {
  id: string;
  workspace_id: string;
  source_type: 'job' | 'decision' | 'outcome' | 'receipt' | 'blocked_item' | 'approval';
  source_id: string;
  title: string;
  summary: string;
  category: 'owner_decision' | 'interruption_avoided' | 'completed_work' | 'blocked_work' | 'risk' | 'win' | 'digest';
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
}
