export type HeadlessActionType =
  | 'view_work_item'
  | 'complete_work_item'
  | 'approve_draft'
  | 'reject_draft'
  | 'request_missing_info'
  | 'assign_owner'
  | 'add_note'
  | 'review_document'
  | 'upload_document'
  | 'view_owner_brief'
  | 'view_deal_status'
  | 'reply_to_request';

export type HeadlessChannel = 'email' | 'sms' | 'in_app';

export type HeadlessAction = {
  id: string;
  workspaceId: string;
  actionType: HeadlessActionType;
  sourceType:
    | 'work_item'
    | 'approval'
    | 'deal'
    | 'document'
    | 'marketing_request'
    | 'compliance_checklist'
    | 'office_issue'
    | 'owner_brief'
    | 'integration_signal';
  sourceId: string;
  recipientStaffMemberId?: string;
  recipientClientId?: string;
  recipientAgentId?: string;
  channel: HeadlessChannel;
  status:
    | 'queued'
    | 'sent'
    | 'clicked'
    | 'completed'
    | 'expired'
    | 'failed'
    | 'cancelled';
  secureTokenHash: string;
  expiresAt: string;
  createdAt: string;
  clickedAt?: string;
  completedAt?: string;
};

export type StaffNotificationPreference = {
  staffMemberId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  preferredChannel: 'email' | 'sms' | 'both';
  quietHoursStart?: string; // e.g. "22:00"
  quietHoursEnd?: string;   // e.g. "07:00"
  timezone?: string;
};

export type ClientDealPortalAccess = {
  id: string;
  workspaceId: string;
  dealId: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  tokenHash: string;
  expiresAt?: string;
  status: 'active' | 'expired' | 'revoked';
  createdAt: string;
  lastAccessedAt?: string;
};

export type AgentActionPortalAccess = {
  id: string;
  workspaceId: string;
  agentId: string;
  actionId: string; // e.g. work item ID
  tokenHash: string;
  expiresAt?: string;
  status: 'active' | 'expired' | 'revoked';
  createdAt: string;
  lastAccessedAt?: string;
};

export type BrandingSettings = {
  brokerageName: string;
  logoUrl?: string;
  primaryColor?: string; // hex code, e.g. "#18382b"
  emailHeaderLogo?: string;
  secureActionPageBrand?: string;
  clientPortalBrand?: string;
  replyToEmail?: string;
  notificationFooter?: string;
};

export type WebhookSubscription = {
  id: string;
  workspaceId: string;
  targetUrl: string;
  events: string[];
  secretHash: string;
  status: 'active' | 'paused' | 'failed';
  createdAt: string;
};
