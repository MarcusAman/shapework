export type ActionNotification = {
  id: string;
  workspaceId: string;
  workItemId?: string;
  approvalId?: string;
  recipientStaffMemberId: string;
  recipientName: string;
  recipientEmail?: string;
  recipientPhone?: string;
  channel: "email" | "sms";
  status: "queued" | "sent" | "failed" | "clicked" | "acted" | "expired";
  actionType:
    | "view_work_item"
    | "approve_action"
    | "reject_action"
    | "complete_work_item"
    | "assign_owner"
    | "add_missing_info"
    | "view_owner_brief";
  secureActionTokenHash: string;
  expiresAt: string;
  createdAt: string;
  sentAt?: string;
  clickedAt?: string;
  actedAt?: string;
};

export type SecureActionToken = {
  id: string;
  workspaceId: string;
  recipientStaffMemberId: string;
  workItemId?: string;
  approvalId?: string;
  actionType: string;
  tokenHash: string;
  expiresAt: string;
  usedAt?: string;
  createdAt: string;
};

export function logNotificationAudit(
  dbState: any,
  userName: string,
  userRole: string,
  description: string,
  category: string
) {
  if (!dbState.auditEvents) dbState.auditEvents = [];
  const event = {
    id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    user_name: userName,
    user_role: userRole,
    action_description: description,
    impact_area: category.toLowerCase(),
    action: description,
    actor: userName,
    system: 'shapework',
    target_record: '',
    metadata: {}
  };
  dbState.auditEvents.unshift(event);
}
