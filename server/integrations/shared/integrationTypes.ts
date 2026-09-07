/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface WorkspaceIntegrationConnection {
  id: string;
  workspaceId: string;
  provider: "google_workspace" | "microsoft_365";
  status: "setup_needed" | "connected" | "expired" | "disconnected" | "error" | "reauth_required";
  connectedByUserId: string;
  connectedAt: string;
  disconnectedAt?: string;
  providerAccountId?: string;
  providerAccountEmail?: string;
  accountEmail?: string;
  tenantId?: string;
  scopes: string[];
  encryptedAccessToken: string;
  encryptedRefreshToken?: string;
  accessTokenExpiresAt?: string;
  refreshTokenExpiresAt?: string;
  lastSyncedAt?: string;
  lastError?: string;
  tokenVersion?: number;
  lastRefreshAttempt?: string;
  lastSuccessfulRefresh?: string;
  lastRefreshErrorCategory?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkspaceCommunicationSignal {
  id: string;
  workspaceId: string;
  provider: "gmail" | "google_calendar" | "outlook" | "outlook_calendar" | "microsoft_teams";
  sourceRecordId: string;
  sourceUrl?: string;
  signalType:
    | "owner_mentioned"
    | "approval_needed"
    | "inbound_request"
    | "deadline_detected"
    | "closing_detected"
    | "calendar_conflict"
    | "event_prep_needed"
    | "unassigned_team_thread"
    | "overdue_team_followup"
    | "draft_ready_for_approval"
    | "integration_sync_error";
  title: string;
  summary: string;
  relatedPersonEmail?: string;
  relatedStaffMemberId?: string;
  dueDate?: string;
  status: "new" | "reviewed" | "resolved";
  createdAt: string;
}

export interface ExternalActionApproval {
  id: string;
  workspaceId: string;
  provider: "gmail" | "outlook" | "google_calendar" | "outlook_calendar" | "microsoft_teams";
  actionType:
    | "send_email"
    | "create_calendar_event"
    | "update_calendar_event"
    | "post_teams_message";
  proposedPayload: Record<string, unknown>;
  status: "pending" | "approved" | "rejected" | "sent" | "failed";
  requestedBy: string;
  approvedBy?: string;
  createdAt: string;
  approvedAt?: string;
  executedAt?: string;
}
