/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ApiNationDotloopStatus =
  | "not_configured"
  | "webhook_url_ready"
  | "sandbox_active"
  | "configured"
  | "receiving_events"
  | "error";

export type ApiNationDotloopEvent = {
  id: string;
  source: "apination_dotloop";
  channel:
    | "contacts_send_webhook"
    | "loop_participants_send_webhook"
    | "loops_send_webhook"
    | "contact_created_or_updated"
    | "loop_created_or_updated"
    | "document_created_or_updated"
    | "participant_created_or_updated"
    | "unknown";
  receivedAt: string;
  eventType: string;
  loopId?: string;
  loopName?: string;
  loopStatus?: string;
  transactionType?: string;
  propertyAddressMasked?: string;
  participantName?: string;
  participantRole?: string;
  contactName?: string;
  documentName?: string;
  documentStatus?: string;
  rawPayloadRedacted: Record<string, unknown>;
  matchStatus: "matched" | "possible_match" | "unmatched" | "needs_review";
  relatedDealId?: string;
  relatedComplianceItemId?: string;
  auditEventIds: string[];
};
