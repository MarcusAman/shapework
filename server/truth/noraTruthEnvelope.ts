/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NORA Truth Layer — Canonical Server-Side Truth Envelope
 * 
 * Governing Principle:
 * "Every factual answer must identify what supports it. Every offered action
 * must be executable against an authorized integration. Every claimed completion
 * must include provider verification."
 */

export type EvidenceStatus =
  | 'VERIFIED_LIVE'
  | 'APPROVED_KNOWLEDGE'
  | 'VERIFIED_STORED_RECORD'
  | 'DERIVED'
  | 'USER_PROVIDED'
  | 'UNVERIFIED'
  | 'UNKNOWN';

export type ProviderMode =
  | 'LIVE'
  | 'SANDBOX'
  | 'FIXTURE'
  | 'DISCONNECTED';

export type EvidenceSourceType =
  | 'mls'
  | 'directory'
  | 'calendar'
  | 'email'
  | 'drive'
  | 'transaction'
  | 'sop'
  | 'handbook'
  | 'user'
  | 'calculation';

export interface NoraEvidence {
  evidenceId: string;
  status: EvidenceStatus;
  sourceType: EvidenceSourceType;
  provider: string;
  providerMode: ProviderMode;
  workspaceId: string;
  recordId?: string;
  documentVersion?: string;
  retrievedAt: string;
  lastVerifiedAt?: string;
  fieldsSupported: string[];
  label: string;
  rawPayloadSnippet?: string;
}

export interface NoraFact {
  field: string;
  value: unknown;
  evidenceIds: string[];
  qualifier?: string;
}

export interface NoraInference {
  statement: string;
  basedOnEvidenceIds: string[];
  explanation: string;
}

export interface NoraUnknown {
  field: string;
  reason: string;
  suggestedEscalationTarget?: string;
}

export interface NoraProposedAction {
  actionId: string;
  actionType: string;
  capability: string;
  provider: string;
  providerMode: ProviderMode;
  isExecutable: boolean;
  requiresConfirmation: boolean;
  label: string;
  description?: string;
  payload?: Record<string, any>;
  verificationStrategy?: string;
  reasonDisabled?: string;
}

export type NoraAnswerStatus =
  | 'VERIFIED'
  | 'PARTIALLY_VERIFIED'
  | 'CLARIFICATION_REQUIRED'
  | 'UNKNOWN'
  | 'PROVIDER_UNAVAILABLE'
  | 'HUMAN_REVIEW_REQUIRED';

export interface NoraTruthEnvelope {
  turnId: string;
  sessionId: string;
  workspaceId: string;
  answerStatus: NoraAnswerStatus;
  facts: NoraFact[];
  inferences: NoraInference[];
  unknowns: NoraUnknown[];
  evidence: NoraEvidence[];
  proposedActions: NoraProposedAction[];
  metadata?: {
    queryText?: string;
    domain?: string;
    generatedAt: string;
    executionTimeMs?: number;
    auditLogRef?: string;
  };
}

export class TruthEnvelopeBuilder {
  private turnId: string;
  private sessionId: string;
  private workspaceId: string;
  private answerStatus: NoraAnswerStatus = 'UNKNOWN';
  private facts: NoraFact[] = [];
  private inferences: NoraInference[] = [];
  private unknowns: NoraUnknown[] = [];
  private evidence: NoraEvidence[] = [];
  private proposedActions: NoraProposedAction[] = [];
  private metadata: Record<string, any> = { generatedAt: new Date().toISOString() };

  constructor(params: {
    turnId?: string;
    sessionId?: string;
    workspaceId?: string;
  }) {
    this.turnId = params.turnId || `turn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.sessionId = params.sessionId || 'default-session';
    this.workspaceId = params.workspaceId || 'ws_wilmington';
  }

  public setAnswerStatus(status: NoraAnswerStatus): this {
    this.answerStatus = status;
    return this;
  }

  public addEvidence(evidence: NoraEvidence): this {
    if (!this.evidence.some(e => e.evidenceId === evidence.evidenceId)) {
      this.evidence.push(evidence);
    }
    return this;
  }

  public addFact(fact: {
    field: string;
    value: unknown;
    evidenceIds: string[];
    qualifier?: string;
  }): this {
    // Validate evidence references exist
    for (const evId of fact.evidenceIds) {
      if (!this.evidence.some(e => e.evidenceId === evId)) {
        console.warn(`[TruthEnvelopeBuilder] Fact "${fact.field}" references unregistered evidenceId: "${evId}"`);
      }
    }
    this.facts.push(fact);
    return this;
  }

  public addInference(inference: {
    statement: string;
    basedOnEvidenceIds: string[];
    explanation: string;
  }): this {
    this.inferences.push(inference);
    return this;
  }

  public addUnknown(unknown: {
    field: string;
    reason: string;
    suggestedEscalationTarget?: string;
  }): this {
    this.unknowns.push(unknown);
    return this;
  }

  public addProposedAction(action: NoraProposedAction): this {
    this.proposedActions.push(action);
    return this;
  }

  public setMetadata(meta: Record<string, any>): this {
    this.metadata = { ...this.metadata, ...meta };
    return this;
  }

  public build(): NoraTruthEnvelope {
    // Determine overall answerStatus if not explicitly set to something terminal
    if (this.answerStatus === 'UNKNOWN') {
      if (this.unknowns.length > 0 && this.facts.length === 0) {
        this.answerStatus = 'UNKNOWN';
      } else if (this.facts.length > 0 && this.unknowns.length > 0) {
        this.answerStatus = 'PARTIALLY_VERIFIED';
      } else if (this.facts.length > 0) {
        const hasLive = this.evidence.some(e => e.status === 'VERIFIED_LIVE' || e.status === 'APPROVED_KNOWLEDGE' || e.status === 'VERIFIED_STORED_RECORD');
        this.answerStatus = hasLive ? 'VERIFIED' : 'PARTIALLY_VERIFIED';
      }
    }

    return {
      turnId: this.turnId,
      sessionId: this.sessionId,
      workspaceId: this.workspaceId,
      answerStatus: this.answerStatus,
      facts: this.facts,
      inferences: this.inferences,
      unknowns: this.unknowns,
      evidence: this.evidence,
      proposedActions: this.proposedActions,
      metadata: this.metadata as any
    };
  }
}
