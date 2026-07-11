export type StaffRole =
  | "brokerage_owner"
  | "operations_lead"
  | "transaction_coordinator"
  | "listing_coordinator"
  | "marketing_coordinator"
  | "compliance_partner"
  | "agent_onboarding_owner"
  | "sign_inventory_owner"
  | "review_request_owner";

export interface RoutingRule {
  id: string;
  requestType: string;
  routeToRole: StaffRole;
  escalationRole?: StaffRole;
  slaHours: number;
  requiresOwnerReview: boolean;
  clarificationRequiredFields: string[];
  approvalRequiredFor: string[];
}

export interface SecureActionLink {
  id: string;
  token: string;
  linkType:
    | "clarification"
    | "document_upload"
    | "sign_request"
    | "review_request"
    | "listing_confirmation"
    | "deal_intake";
  relatedRecordId: string;
  recipientRole: string;
  recipientName: string;
  expiresAt: string;
  status: "draft" | "sent_demo" | "opened" | "submitted" | "expired";
  requiredFields: string[];
  submittedValues?: Record<string, string>;
  auditEventIds: string[];
}

export interface IntegrationEvent {
  id: string;
  timestamp: string;
  source:
    | "manual_import"
    | "email_demo"
    | "sms_demo"
    | "mls_demo"
    | "skyslope_demo"
    | "dotloop_demo"
    | "calendar_demo";
  eventType: string;
  payload: Record<string, any>;
  processed: boolean;
}
