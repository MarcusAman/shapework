/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type BrokerageResponsibility =
  | "agent_marketing"
  | "agent_onboarding"
  | "listing_launch"
  | "transaction_coordination"
  | "compliance_documents"
  | "closing_tracker"
  | "commission_processing"
  | "cash_flow_forecast"
  | "sign_inventory"
  | "office_supplies"
  | "facilities"
  | "events"
  | "client_escalation"
  | "owner_decision"
  | "review_requests"
  | "vendor_management";

export interface BrokerageResponsibilityDetail {
  id: string;
  responsibility: BrokerageResponsibility;
  label: string;
  primaryOwnerRole: string;
  backupOwnerRole: string;
  sla: string;
  escalationRule: string;
  approvalRequired: boolean;
  currentPainLevel: "none" | "low" | "medium" | "high";
  notes: string;
  relatedWorkflow: string;
  ownershipStatus: "clear" | "fuzzy" | "bottleneck" | "single_point_of_failure" | "needs_reassignment";
}

export type BrokerageWorkflowTemplate = {
  id: string;
  name: string;
  description: string;
  problemSolved: string;
  defaultOwnerRole: BrokerageResponsibility;
  triggerSources: Array<"manual" | "email" | "sms" | "rechat" | "dotloop" | "drive" | "calendar" | "quickbooks">;
  requiredInputs: string[];
  defaultSlaHours: number;
  approvalRequiredFor: string[];
  auditEvents: string[];
  quickWinEligible: boolean;
  implementationComplexity: "low" | "medium" | "high";
  reusableIp: boolean;
  isActive?: boolean;
};

export type OperatingOpportunity = {
  id: string;
  workspaceId: string;
  title: string;
  category:
    | "ownership"
    | "marketing"
    | "transaction"
    | "compliance"
    | "finance"
    | "office_operations"
    | "agent_experience"
    | "customer_experience"
    | "integration"
    | "reporting";
  severity: "low" | "medium" | "high";
  frictionScore: number;
  dependencyScore: number;
  wasteScore: number;
  visibilityScore: number;
  readinessScore: number;
  impactScore: number;
  totalScore: number;
  estimatedHoursPerWeek?: number;
  estimatedAnnualCost?: number;
  confidence: "low" | "medium" | "high";
  whatIsHappening: string;
  hiddenCost: string;
  recommendedFix: string;
  quickWinCandidate: boolean;
  buildSprintCandidate: boolean;
  thirdPartyToolFit?: string;
  shapeworkIpFit?: string;
  status: "identified" | "accepted" | "planned" | "in_progress" | "implemented" | "deferred";
};

export type QuickWin = {
  id: string;
  workspaceId: string;
  opportunityId: string;
  title: string;
  description: string;
  ownerRole: string;
  estimatedTimeToImplementHours: number;
  expectedImpact: string;
  implementationSteps: string[];
  requiredTools: string[];
  status: "proposed" | "approved" | "in_progress" | "shipped" | "measured";
  reusableTemplateCreated: boolean;
};

export type BuildSprint = {
  id: string;
  workspaceId: string;
  name: string;
  status: "draft" | "proposed" | "approved" | "in_progress" | "shipped" | "measured";
  opportunityIds: string[];
  workflowTemplateIds: string[];
  scopeSummary: string;
  outOfScope: string[];
  thirdPartyTools: string[];
  shapeworkComponents: string[];
  deliverables: string[];
  assumptions: string[];
  supportTerms: string[];
  estimatedFeeRange?: string;
  startDate?: string;
  targetShipDate?: string;
};

export type OperatingRecord = {
  id: string;
  workspaceId: string;
  businessName: string;
  vertical: "real_estate_brokerage";
  status: "discovery" | "build_sprint" | "launching" | "active" | "paused";
  currentStateMapId?: string;
  opportunityRegisterId?: string;
  roleMapId?: string;
  workflowMapIds: string[];
  systemMapIds: string[];
  routingPolicyId?: string;
  approvalPolicyId?: string;
  auditPolicyId?: string;
  quickWinIds: string[];
  buildSprintIds: string[];
  createdAt: string;
  updatedAt: string;
  
  // Business Snapshot Fields
  teamSize?: number;
  w2Count?: number;
  agentCount?: number;
  primaryCustomerType?: string;
  ownerGoal?: string;
  oneThingToFix?: string;
  toolStack?: Record<string, string[]>;
  currentLaunchMode?: string;
};
