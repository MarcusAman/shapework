/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface IntegrationReceipt {
  id: string;
  source: 'apination_dotloop' | 'rechat';
  channel: string;
  receivedAt: string;
  verificationStatus: 'verified' | 'failed' | 'skipped';
  normalizationStatus: 'success' | 'failed';
  matchStatus: 'matched' | 'possible_match' | 'unmatched' | 'needs_review';
  workflowTriggered?: 'Deal Intake Guard' | 'Closing Compliance Guard' | 'None';
  auditEventId?: string;
  errorMessage?: string;
  
  // Specific Metadata (PII Masked)
  loopName?: string;
  eventType?: string;
  documentName?: string;
  participantRole?: string;
  redactedPayload: Record<string, any>;
  
  // Linked items
  relatedDealId?: string;
  relatedDealTitle?: string;
  relatedWorkflowIssue?: string;
}
