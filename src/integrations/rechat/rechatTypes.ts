/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type RechatConnectionStatus =
  | "not_connected"
  | "oauth_required"
  | "connected_sandbox"
  | "connected_read_only"
  | "connected_approval_gated_write"
  | "webhooks_configured"
  | "error";

export type ShapeworkRechatDeal = {
  source: "rechat";
  rechatId: string;
  title: string;
  dealType?: string;
  listingId?: string;
  brandId?: string;
  stage?: string;
  status?: string;
  propertyAddress?: string;
  closingDate?: string;
  contractDate?: string;
  listPrice?: number;
  salesPrice?: number;
  roles: Array<{
    role: string;
    name?: string;
    emailMasked?: string;
    phoneMasked?: string;
    rechatUserId?: string;
  }>;
  context: Record<string, unknown>;
  missingFields: string[];
  lastSyncedAt: string;
};

export type ShapeworkRechatContact = {
  source: "rechat";
  rechatId: string;
  displayName: string;
  emailMasked?: string;
  phoneMasked?: string;
  ownerId?: string;
  tags?: string[];
  lastSyncedAt: string;
};

export type ShapeworkRechatTask = {
  source: "rechat";
  rechatId: string;
  title: string;
  description?: string;
  status: "PENDING" | "DONE" | "unknown";
  taskType?: "Call" | "Message" | "Todo" | string;
  dueDate?: string;
  assigneeIds: string[];
  associatedDealId?: string;
  associatedContactId?: string;
  associatedListingId?: string;
  lastSyncedAt: string;
};

export type ShapeworkRechatWebhookEvent = {
  source: "rechat";
  topic: "Deals" | "Showings" | "Contacts" | string;
  eventId: string;
  brandId?: string;
  rechatRecordId?: string;
  receivedAt: string;
  verified: boolean;
  rawPayload: Record<string, unknown>;
};
