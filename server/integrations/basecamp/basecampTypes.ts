/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BasecampConnection {
  id: string;
  workspaceId: string;
  accountId: string;
  accountName?: string;
  status: 'connected' | 'expired' | 'disconnected' | 'error';
  encryptedAccessToken: string;
  encryptedRefreshToken: string;
  accessTokenExpiresAt?: string;
  refreshTokenExpiresAt?: string;
  connectedByUserId: string;
  connectedAt: string;
  lastSyncedAt?: string;
  lastError?: string;
}

export type BasecampSignalType =
  | 'todo_overdue'
  | 'todo_unassigned'
  | 'owner_mentioned'
  | 'task_stuck'
  | 'marketing_request_detected'
  | 'event_task_detected'
  | 'office_issue_detected'
  | 'vendor_followup_detected'
  | 'basecamp_sync_error';

export interface BasecampSignal {
  id: string;
  workspaceId: string;
  sourceSystem: 'basecamp';
  sourceRecordId: string;
  sourceProjectId?: string;
  sourceUrl?: string;
  signalType: BasecampSignalType;
  title: string;
  summary: string;
  assignedPersonName?: string;
  dueDate?: string;
  status: 'new' | 'reviewed' | 'resolved';
  createdAt: string;
}

export interface BasecampSyncSummary {
  accountName?: string;
  projectsChecked: number;
  todosChecked: number;
  eventsChecked: number;
  exceptionsCreated: number;
  lastSyncedAt: string;
}

// Interfaces matching Launchpad identity responses
export interface BasecampIdentityAccount {
  id: number;
  name: string;
  href: string;
  product: string;
}

export interface BasecampIdentity {
  expires_at: string;
  identity: {
    id: number;
    email_address: string;
    first_name: string;
    last_name: string;
  };
  accounts: BasecampIdentityAccount[];
}
