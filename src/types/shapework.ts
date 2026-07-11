/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Organization {
  id: string;
  name: string;
  tagline: string;
}

export interface Office {
  id: string;
  name: string;
  address: string;
}

export interface Person {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'owner' | 'admin' | 'operations_lead' | 'transaction_coordinator' | 'compliance_partner' | 'listing_coordinator' | 'marketing_coordinator' | 'events' | 'maintenance' | 'agent_support' | 'agent' | 'shapework_operator';
  avatar?: string;
  organization_id: string;
}

export type StaffRole = 
  | 'owner' 
  | 'admin' 
  | 'operations_lead' 
  | 'transaction_coordinator' 
  | 'compliance_partner' 
  | 'listing_coordinator' 
  | 'marketing_coordinator' 
  | 'events' 
  | 'maintenance' 
  | 'maintenance_supplies'
  | 'agent_support' 
  | 'agent' 
  | 'shapework_operator';

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  organization_id: string;
  cellPhone?: string;
  status?: 'active' | 'inactive' | 'pending';
  canReceiveEscalations?: boolean;
  isBackupOwner?: boolean;
  createdAt?: string;
  updatedAt?: string;
  workspaceId?: string;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  active_listings_count: number;
  active_transactions_count: number;
}

export interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  type?: string;
}

export interface Transaction {
  id: string;
  property_address: string;
  client_name: string;
  buyer_or_seller: 'buyer' | 'seller';
  responsible_agent_id: string;
  transaction_coordinator_id: string;
  current_stage: 'contract_to_close' | 'financing_milestone' | 'inspection_and_repair' | 'closing_prep' | 'closed';
  expected_closing_date: string;
  health_score: number; // 0-100
  risk_level: 'healthy' | 'watch' | 'at_risk' | 'blocked';
  risk_reasons: string[];
  outstanding_milestones_count: number;
  latest_update: string;
  revenue: number; // Projected brokerage revenue
  waiting_on: 'Agent' | 'Lender' | 'Title' | 'Client' | 'Vendor' | 'None';
  next_action: string;
  last_verified_update: string;
}

export interface Listing {
  id: string;
  property_address: string;
  responsible_agent_id: string;
  status: 'draft' | 'preparing' | 'active' | 'under_contract' | 'sold';
  list_price: number;
  target_launch_date: string;
  blocking_items: string[];
  marketing_readiness: 'not_started' | 'in_progress' | 'ready';
  compliance_status: 'pending' | 'approved' | 'rejected';
  last_communication: string;
  next_action: string;
  owner: string; // coordinator or agent name
  launch_checklist: {
    id: string;
    step_name: string;
    status: 'pending' | 'completed' | 'overdue';
    completed_at?: string;
  }[];
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  trigger_event: string;
  category: 'onboarding' | 'listing' | 'contract' | 'milestones' | 'closing' | 'admin';
  steps: {
    id: string;
    step_name: string;
    assigned_role: string;
    due_days_offset: number;
    requires_approval: boolean;
    integration_action?: string;
  }[];
}

export interface Task {
  id: string;
  transaction_id?: string;
  listing_id?: string;
  title: string;
  description: string;
  assigned_to_role: string;
  assigned_to_name?: string;
  due_date: string;
  status: 'pending' | 'completed' | 'overdue';
  is_automated: boolean;
  time_saved_minutes: number;
}

export interface Communication {
  id: string;
  type: 'email' | 'sms' | 'document' | 'webhook' | 'calendar';
  sender: string;
  sender_email: string;
  subject: string;
  body: string;
  received_at: string;
  source_system: 'gmail' | 'outlook' | 'sms' | 'docusign' | 'gcal' | 'gdrive' | 'rechat' | 'webhook';
  category: 'financing' | 'signatures' | 'disclosures' | 'inspection' | 'general';
  status: 'unread' | 'read' | 'completed' | 'archived';
  action_proposal_id?: string;
  related_property: string;
  related_agent: string;
  intent: string;
  urgency: 'high' | 'medium' | 'low';
  time: string;
  confidence: number; // 0.0 - 1.0
  workflow: string;
  attachment_indicator: boolean;
  original_message?: string;
  ai_summary?: string;
  commitment_deadline?: string;
  suggested_workflow_update?: string;
  recommended_action?: string;
  source_evidence?: string;
  activity_history?: { timestamp: string; action: string; user: string }[];
}

export interface Document {
  id: string;
  name: string;
  status: 'pending_review' | 'approved' | 'rejected' | 'missing';
  uploaded_by?: string;
  uploaded_at?: string;
  file_size?: string;
  file_type?: string;
  transaction_id?: string;
}

export interface IntegrationConnection {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  last_sync: string;
  permissions_granted: string[];
  records_synchronized: number;
  errors_count: number;
  purpose: string;
  data_categories: string[];
  recent_errors?: string[];
}

export interface AIActionProposal {
  id: string;
  transaction_id?: string;
  property_address?: string;
  action_type: 'draft_email' | 'create_calendar_draft' | 'request_external_status' | 'flag_transaction_risk' | 'assign_workflow_owner' | 'prepare_client_update';
  title: string;
  description: string;
  state: 'suggested' | 'awaiting_approval' | 'approved' | 'executing' | 'completed' | 'failed' | 'dismissed';
  confidence: number; // 0.0 - 1.0
  created_at: string;
  draft_content?: string;
  target_recipient?: string;
}

export interface AuditEvent {
  id: string;
  workspaceId?: string;
  timestamp: string;
  user_name: string;
  user_role: string;
  action_description: string;
  impact_area: string;
  action?: string;
  actor?: string;
  system?: string;
  target_record?: string;
  metadata?: {
    before_value?: string;
    after_value?: string;
  };
}

export interface RiskSignal {
  id: string;
  property: string;
  type: 'transaction' | 'listing' | 'compliance' | 'communication' | 'integration';
  reason: string;
  revenue_impact: number;
  waiting_on: string;
  owner: string;
  deadline: string;
  last_update: string;
  recommended_action: string;
}

export interface RevenueImpact {
  projected_revenue: number;
  at_risk_revenue: number;
  secured_revenue: number;
}

export interface CapacityMetric {
  coordinator_name: string;
  assigned_work: number;
  overdue_items: number;
  new_work_today: number;
  avg_resolution_time: string;
  capacity_percentage: number;
  suggested_reassignment?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  proposal?: AIActionProposal;
  commandPlan?: CommandPlan;
}

export interface EmailAccount {
  id: string;
  address: string;
  type: 'gmail' | 'outlook' | 'shared_inbox' | 'transaction_inbox';
  status: 'connected' | 'disconnected' | 'error' | 'needs_attention';
  last_sync: string;
  monitored_folders: string[];
  processed_count: number;
  matched_count: number;
  low_confidence_count: number;
  proposed_actions_count: number;
  completed_actions_count: number;
  scope_purpose: string;
  permissions: string[];
}

export interface EmailMessage {
  id: string;
  sender: string;
  sender_email: string;
  subject: string;
  body: string;
  received_at: string;
  matched_property: string;
  confidence: number;
  intent: string;
  stage_update: string;
  risk_level: 'healthy' | 'watch' | 'at_risk' | 'blocked';
  recommended_action: string;
  approval_required: boolean;
  status: 'processing' | 'matched' | 'low_confidence' | 'needs_approval' | 'auto_updated' | 'failed' | 'ignored';
  evidence: string;
}

export interface EmailProcessingResult {
  messageId: string;
  propertyAddress: string;
  inferredStage: string;
  confidenceScore: number;
  requiresReview: boolean;
  actionTaken: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  category: 'low' | 'medium' | 'high';
  enabled: boolean;
  confidence_threshold: number;
}

export interface AutomationPolicy {
  redact_sensitive_data: boolean;
  business_only: boolean;
  notify_broker_on_escalation: boolean;
  external_requires_approval: boolean;
}

export interface CommandRequest {
  id: string;
  query: string;
  timestamp: string;
}

export interface CommandStep {
  id: string;
  action: string;
  target: string;
  system: string;
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'cancelled';
  requires_approval: boolean;
}

export interface CommandPlan {
  id: string;
  query: string;
  intent_detected: string;
  affected_records_count: number;
  affected_records: string[];
  required_integrations: string[];
  steps: CommandStep[];
  risk_level: 'low' | 'medium' | 'high';
  requires_approval: boolean;
  execution_status: 'draft' | 'running' | 'completed' | 'failed' | 'cancelled';
  impact_estimate: string;
}

export interface AgentPlaybook {
  trigger: string;
  conditions: string[];
  recordsToInspect: string[];
  toolsAllowed: string[];
  confidenceThreshold: number;
  autoSafeActions: string[];
  approvalRequiredActions: string[];
  escalationPath: string;
  auditRequirements: string[];
  steps: string[];
}

export interface AgentDefinition {
  id: string;
  name: string;
  role: string;
  status: 'idle' | 'monitoring' | 'running' | 'needs_approval' | 'blocked' | 'error';
  watched_sources: string[];
  last_run: string;
  next_scheduled_run: string;
  actions_prepared_today: number;
  actions_completed_today: number;
  items_requiring_approval: number;
  confidence_range: string;
  permission_level: 'read_only' | 'restricted_write' | 'full_control';
  mission: string;
  can_do_automatically: string[];
  requires_approval: string[];
  never_does: string[];
  connected_tools: string[];
  playbook: AgentPlaybook;
}

export interface AgentRun {
  runId: string;
  agentId: string;
  status: 'completed' | 'failed' | 'running' | 'cancelled';
  trigger: string;
  startedAt: string;
  completedAt: string;
  recordsScanned: number;
  findings: string[];
  recommendations: string[];
  actionsPrepared: number;
  actionsExecuted: number;
  approvalsRequired: number;
  evidence: string;
  auditEventsCreated: string[];
  errors?: string[];
  nextRunAt?: string;
}

export interface AgentObservation {
  id: string;
  timestamp: string;
  agentId: string;
  source: string;
  observedText: string;
  extractedFacts: string[];
}

export interface AgentEvent {
  id: string;
  timestamp: string;
  trigger: string;
  agentId: string;
  recordsInspected: string[];
  findings: string[];
  recommendedAction: string;
  approvalStatus: 'auto-safe' | 'approval required' | 'needs human review' | 'blocked by policy' | 'external action' | 'compliance-sensitive' | 'material change' | 'audit recorded';
  auditEventId?: string;
  rollbackAvailable?: boolean;
}

export interface AgentGovernancePolicy {
  globalAutomationPause: boolean;
  requireApprovalExternalMessages: boolean;
  requireApprovalComplianceSensitive: boolean;
  requireApprovalMaterialChanges: boolean;
  lowConfidenceThreshold: number;
  retentionDays: number;
}

export type DiscoveryProblem = {
  id: string;
  title: string;
  workflow: "transaction_flow" | "agent_request_loop" | "owner_day" | "new_business";
  severity: "low" | "medium" | "high" | "critical";
  frequency: "daily" | "weekly" | "monthly" | "per_transaction" | "per_listing" | "per_agent";
  ownerImpact: "low" | "medium" | "high" | "very_high";
  revenueImpact: "low" | "medium" | "high" | "very_high";
  complianceImpact: "none" | "low" | "medium" | "high";
  currentState: string;
  desiredState: string;
  productModule: string;
  recommendedAutomation: string;
  firstMvpAction: string;
  relatedAgents: string[];
  relatedIntegrations: string[];
};

export type AgentRequest = {
  id: string;
  source: "email" | "sms" | "secure_link" | "manual" | "voice_note";
  requesterRole: "agent" | "owner" | "coordinator" | "vendor" | "partner";
  requesterName: string;
  requestType:
    | "marketing"
    | "listing_launch"
    | "transaction"
    | "compliance"
    | "sign_inventory"
    | "supplies"
    | "owner_escalation"
    | "onboarding"
    | "review_request"
    | "other";
  title: string;
  rawMessage: string;
  structuredSummary: string;
  priority: "low" | "normal" | "high" | "urgent";
  assignedTeam: string;
  assignedOwner: string;
  status:
    | "new"
    | "needs_clarification"
    | "routed"
    | "waiting_on_agent"
    | "in_progress"
    | "ready_for_approval"
    | "completed"
    | "escalated";
  missingInfo: string[];
  dueDate?: string;
  relatedPropertyId?: string;
  relatedTransactionId?: string;
  relatedListingId?: string;
  shouldEscalateToOwner: boolean;
  escalationReason?: string;
  recommendedAction: string;
  auditEvents: string[];
};

export type Workspace = {
  id: string;
  name: string;
  slug: string;
  industry: "real_estate_brokerage";
  status: "onboarding" | "active" | "paused" | "archived";
  timezone: string;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceUser = {
  id: string;
  workspaceId: string;
  email: string;
  name: string;
  role:
    | "owner"
    | "operations_lead"
    | "transaction_coordinator"
    | "compliance_partner"
    | "listing_coordinator"
    | "marketing_coordinator"
    | "agent"
    | "admin";
  permissions: string[];
  status: "invited" | "active" | "disabled";
};

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  status: "active" | "disabled";
};

export type WorkspaceMembership = {
  id: string;
  userId: string;
  workspaceId: string;
  role: WorkspaceUser["role"];
  permissions: string[];
  status: "active" | "disabled" | "invited";
};

export type WorkItemType =
  | "marketing_request"
  | "missing_information"
  | "owner_escalation"
  | "transaction_intake_gap"
  | "closing_compliance_risk"
  | "document_request"
  | "office_readiness_issue"
  | "sign_inventory_issue"
  | "approval_needed"
  | "integration_error"
  | "unmatched_record"
  | "role_gap"
  | "missing_document"
  | "compliance_chase"
  | "commission_readiness_gap"
  | "marketing_request_missing_info"
  | "listing_launch_task"
  | "sign_or_lockbox_issue"
  | "office_issue"
  | "vendor_follow_up"
  | "review_request_approval"
  | "tool_sync_issue";

export interface WorkItem {
  id: string;
  workspaceId: string;
  type: WorkItemType;
  title: string;
  source: 'manual' | 'rechat' | 'dotloop' | 'system';
  relatedType: 'transaction' | 'listing' | 'person' | 'workflow' | null;
  relatedId: string | null;
  relatedLabel?: string;
  ownerRole: string;
  sourceSystem?: string;
  assignedUserId?: string;
  assignedUserName?: string;
  assignedStaffMemberId?: string;
  assignedOwnerName?: string;
  assignedOwnerRole?: StaffRole;
  backupStaffMemberId?: string;
  backupOwnerName?: string;
  backupOwnerRole?: StaffRole;
  isEscalated?: boolean;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'waiting_on_agent';
  recommendedNextAction: string;
  approvalRequired: boolean;
  auditTrailLink?: string;
  payload?: any;
  createdAt: string;
  updatedAt: string;
}

export interface SignInventoryItem {
  id: string;
  workspaceId: string;
  type: string;
  total: number;
  checkedOut: number;
  location: string;
  lowStockThreshold: number;
}

export interface OfficeSupplyItem {
  id: string;
  workspaceId: string;
  item: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  lastChecked: string;
}

export interface FacilitiesIssue {
  id: string;
  workspaceId: string;
  issue: string;
  status: 'pending' | 'resolved';
  assignedTo: string;
  isEscalated: boolean;
}

export type BrokerageEntryPointType =
  | "listing_agreement_submitted"
  | "buyer_agreement_submitted"
  | "under_contract_file_created"
  | "document_uploaded"
  | "marketing_request_submitted"
  | "listing_launch_support_needed"
  | "sign_or_lockbox_request"
  | "office_issue_reported"
  | "vendor_help_needed"
  | "commission_readiness_check"
  | "review_request_ready"
  | "owner_escalation_requested";

export type BrokerageEntryPoint = {
  id: string;
  workspaceId: string;
  type: BrokerageEntryPointType;
  sourceSystem: "rechat" | "dotloop" | "google_drive" | "google_calendar" | "basecamp" | "quickbooks" | "email" | "sms" | "manual" | "csv";
  sourceRecordId?: string;
  relatedTransactionId?: string;
  relatedMarketingRequestId?: string;
  relatedPersonId?: string;
  receivedAt: string;
  createdBy?: string;
  assignedOwnerRole?: string;
  backupOwnerRole?: string;
  requiresReview: boolean;
  status: "new" | "reviewing" | "routed" | "waiting" | "resolved" | "escalated";
};
