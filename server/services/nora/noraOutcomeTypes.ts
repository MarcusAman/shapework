/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NORA Conversation Outcome & Follow-Up System Types
 * Defines the structured outcome model, knowledge assertion links, and follow-up decision schema.
 */

export type NoraChannel = 'voice' | 'chat' | 'email' | 'operational_request';

export type NoraIdentityStatus = 'verified' | 'unverified' | 'external';

export type NoraResolutionStatus = 'resolved' | 'escalated' | 'action_created' | 'unresolved';

export type NoraFollowUpType = 
  | 'KNOWLEDGE_RESOURCES' 
  | 'SOP_INSTRUCTIONS' 
  | 'REQUEST_CONFIRMATION' 
  | 'ESCALATION_NOTICE' 
  | 'NONE';

export type NoraFollowUpStatus = 'pending' | 'sent' | 'suppressed' | 'failed';

export type NoraKnowledgeVerificationStatus = 
  | 'VERIFIED' 
  | 'PARTIALLY_VERIFIED' 
  | 'INFERRED' 
  | 'OUTDATED' 
  | 'UNVERIFIED' 
  | 'CONFLICTING';

export interface NoraKnowledgeItem {
  assertionId?: string;
  title: string;
  summary: string;
  verificationStatus: NoraKnowledgeVerificationStatus;
  sourceUrl?: string;
  sourceTitle?: string;
  caveat?: string;
}

export interface NoraResourceItem {
  title: string;
  url: string;
  description?: string;
  type: 'link' | 'guide' | 'portal' | 'form' | 'download';
}

export interface NoraSopItem {
  code: string;
  title: string;
  owner: string;
  stepsSummary?: string[];
}

export interface NoraAgentIdentity {
  status: NoraIdentityStatus;
  agentId?: string;
  fullName: string;
  email: string | null;
  office: string;
  market: string;
  role: string;
}

export interface NoraCallerIdentity {
  name: string;
  phone: string;
  isRepresentingAgent: boolean;
  representedAgentId?: string;
  representedAgentName?: string;
  relationshipToAgent?: 'assistant' | 'team_member' | 'co_agent' | 'self' | 'unknown';
}

export interface NoraFollowUpDecision {
  recommended: boolean;
  reason: string;
  followUpType: NoraFollowUpType;
  idempotencyKey: string;
}

export interface NoraConversationOutcome {
  conversationId: string;
  channel: NoraChannel;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  agentIdentity: NoraAgentIdentity;
  callerIdentity: NoraCallerIdentity;
  intent: string;
  goal: string;
  summary: string;
  transcript?: string;
  knowledgeUsed: NoraKnowledgeItem[];
  sopsUsed: NoraSopItem[];
  resourcesUsed: NoraResourceItem[];
  warnings: string[];
  requestsCreated: Array<{
    requestId: string;
    type: string;
    assignedTo: string;
    summary: string;
  }>;
  resolutionStatus: NoraResolutionStatus;
  followUp: NoraFollowUpDecision & {
    status: NoraFollowUpStatus;
    sentAt?: string;
    recipientEmail?: string;
    subject?: string;
    messageId?: string;
    errorMessage?: string;
  };
}

export interface PersistedFollowUpEmail {
  id: string;
  conversationId: string;
  conversationChannel: NoraChannel;
  idempotencyKey: string;
  recipientEmail: string;
  recipientName: string;
  representedAgentId?: string;
  callerName?: string;
  callerPhone?: string;
  intent?: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  status: NoraFollowUpStatus;
  errorMessage?: string;
  messageId?: string;
  knowledgeAssertionIds: string[];
  sopCodes: string[];
  resourceUrls: string[];
  warnings: string[];
  metadata?: Record<string, any>;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
}
