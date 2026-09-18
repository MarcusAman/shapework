/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Omnichannel Contract Intake Domain Types — Phase 4A.1 Architecture
 * Provider-neutral schemas for multi-channel events and broker identity bindings.
 */

import { ContractChannel } from './contractDomainTypes.js';

export type VerificationMethod = 
  | 'auth_token' 
  | 'roster_verified_phone' 
  | 'roster_verified_email' 
  | 'mfa_challenge';

export type IdentityBindingStatus = 'active' | 'revoked' | 'expired';

export interface ChannelIdentityBinding {
  id: string;
  workspaceId: string;
  userId: string;
  channel: ContractChannel;
  verifiedIdentifier: string; // e.g. normalized phone '+19105551234' or email 'alice@nestrealty.com'
  verificationMethod: VerificationMethod;
  status: IdentityBindingStatus;
  verifiedAt: string;
  expiresAt?: string;
  capabilities: string[];
}

export type EventProcessingStatus = 'received' | 'processed' | 'rejected' | 'failed';

export interface ContractChannelEvent {
  id: string;
  workspaceId: string;
  channel: ContractChannel;
  direction: 'inbound' | 'outbound';
  externalConversationId?: string;
  externalMessageId?: string;
  contractSessionId: string;
  identityBindingId: string;
  actorUserId: string;
  receivedAt: string;
  correlationId: string;
  idempotencyKey: string;
  normalizedIntent: string;
  processingStatus: EventProcessingStatus;
  rawPayloadSummary?: Record<string, any>;
  errorMessage?: string;
}
