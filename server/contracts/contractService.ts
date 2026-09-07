/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Contract Service Layer — Phase 2.1 Hardened Architecture
 * Orchestrates business logic, capability authorization, state transitions, validation, and audit logging.
 */

import { defaultContractRepository, ProductionSafetyGate } from './contractRepository.js';
import { ContractValidationEngine } from './contractValidationSchemas.js';
import { ContractStateMachine } from './contractStateMachine.js';
import { MockContractFormProvider } from './mockContractFormProvider.js';
import { ContractFormsConfigService } from './contractFormsConfig.js';
import { LicensedFormProviderFactory } from './licensedFormProviderFactory.js';
import {
  ContractIntakeSession,
  ContractTerms,
  SourceReference,
  FormSelectionMetadata,
  ContractChannel,
  ContractTransactionType,
  TransactionParty,
  ContractProperty,
  ContractAuditEvent
} from './contractDomainTypes.js';

export interface CreateSessionParams {
  workspaceId: string;
  requestingUserId: string;
  requestingBrokerId: string;
  officeId?: string;
  opsRequestId?: string;
  channel?: ContractChannel;
  transactionType?: ContractTransactionType;
  idempotencyKey?: string;
  parties?: TransactionParty[];
  property?: ContractProperty;
  actorCapability?: string;
}

export class ContractService {

  /**
   * Create a new contract intake session.
   */
  public static async createSession(params: CreateSessionParams): Promise<ContractIntakeSession> {
    const {
      workspaceId,
      requestingUserId,
      requestingBrokerId,
      officeId = 'wilmington_coastal_nc',
      opsRequestId,
      channel = 'web',
      transactionType = 'residential_resale_buyer_offer',
      idempotencyKey,
      parties = [],
      property,
      actorCapability = 'contract_authoring'
    } = params;

    // Idempotency check
    if (idempotencyKey) {
      const existing = await defaultContractRepository.findByIdempotencyKey(idempotencyKey, workspaceId);
      if (existing) {
        return existing;
      }
    }

    const sessionId = `cnt_sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newSession: ContractIntakeSession = {
      id: sessionId,
      workspaceId,
      officeId,
      opsRequestId,
      requestingUserId,
      requestingBrokerId,
      channel,
      transactionType,
      representationSide: 'buyer',
      status: 'intake_started',
      technicalValidationStatus: 'unvalidated',
      bicReviewRequired: false,
      brokerApprovalStatus: 'pending',
      idempotencyKey,
      parties,
      property,
      terms: {},
      sources: [],
      selectedForms: [],
      validationIssues: [],
      createdAt: now,
      updatedAt: now,
      version: 1
    };

    // Save initial state
    await defaultContractRepository.save(newSession);

    // Auto-transition to identity_verified
    const { updatedSession, auditEvent } = ContractStateMachine.transition({
      session: newSession,
      targetStatus: 'identity_verified',
      actorUserId: requestingUserId,
      actorCapability,
      sourceChannel: channel,
      idempotencyKey
    });

    await defaultContractRepository.save(updatedSession);
    await defaultContractRepository.saveAuditEvent(auditEvent);

    return updatedSession;
  }

  /**
   * Update transaction terms and source references.
   */
  public static async updateTerms(
    sessionId: string,
    workspaceId: string,
    terms: Partial<ContractTerms>,
    sources: SourceReference[],
    actorUserId: string,
    actorCapability: string = 'contract_authoring'
  ): Promise<ContractIntakeSession> {
    const session = await defaultContractRepository.findById(sessionId, workspaceId);
    if (!session) {
      throw new Error(`Contract intake session '${sessionId}' not found.`);
    }

    if (session.status === 'intake_started') {
      const t = ContractStateMachine.transition({ session, targetStatus: 'identity_verified', actorUserId, actorCapability });
      await defaultContractRepository.saveAuditEvent(t.auditEvent);
    }

    if (session.status === 'identity_verified') {
      const t = ContractStateMachine.transition({ session, targetStatus: 'terms_collecting', actorUserId, actorCapability });
      await defaultContractRepository.saveAuditEvent(t.auditEvent);
    } else if (['validation_blocked', 'broker_review_required', 'terms_confirmation_required'].includes(session.status)) {
      const t = ContractStateMachine.transition({ session, targetStatus: 'terms_collecting', actorUserId, actorCapability });
      await defaultContractRepository.saveAuditEvent(t.auditEvent);
    }

    session.terms = { ...session.terms, ...terms };
    session.sources = [...session.sources, ...sources];
    session.updatedAt = new Date().toISOString();

    // Sensitive Data Guard Pass on Terms Update
    ContractValidationEngine.detectAndSanitizeSensitiveData(session, session.validationIssues, session.updatedAt);

    await defaultContractRepository.save(session);
    return session;
  }

  /**
   * Broker confirms collected terms.
   */
  public static async confirmTerms(
    sessionId: string,
    workspaceId: string,
    actorUserId: string,
    actorCapability: string = 'contract_authoring'
  ): Promise<ContractIntakeSession> {
    const session = await defaultContractRepository.findById(sessionId, workspaceId);
    if (!session) throw new Error(`Contract intake session '${sessionId}' not found.`);

    if (session.status !== 'terms_collecting') {
      throw new Error(`Cannot confirm terms from status '${session.status}'. Must be in 'terms_collecting'.`);
    }

    const { updatedSession, auditEvent } = ContractStateMachine.transition({
      session,
      targetStatus: 'terms_confirmation_required',
      actorUserId,
      actorCapability
    });

    await defaultContractRepository.save(updatedSession);
    await defaultContractRepository.saveAuditEvent(auditEvent);
    return updatedSession;
  }

  /**
   * Select form metadata.
   */
  public static async selectForms(
    sessionId: string,
    workspaceId: string,
    forms: FormSelectionMetadata[],
    actorUserId: string,
    actorCapability: string = 'contract_authoring'
  ): Promise<ContractIntakeSession> {
    const session = await defaultContractRepository.findById(sessionId, workspaceId);
    if (!session) throw new Error(`Contract intake session '${sessionId}' not found.`);

    // Check workspace availability for selected forms
    for (const f of forms) {
      if (f.workspaceAvailability && f.workspaceAvailability.length > 0 && !f.workspaceAvailability.includes(workspaceId)) {
        throw new Error(`Form metadata '${f.displayName}' is not available in workspace '${workspaceId}'.`);
      }

      if (!f.activeStatus) {
        throw new Error(`Form metadata '${f.displayName}' is marked retired/inactive and cannot be selected for new drafts.`);
      }
    }

    if (session.status === 'terms_confirmation_required') {
      const t = ContractStateMachine.transition({ session, targetStatus: 'form_selection_required', actorUserId, actorCapability });
      await defaultContractRepository.saveAuditEvent(t.auditEvent);
    }

    session.selectedForms = forms;
    session.updatedAt = new Date().toISOString();

    const formAuditEvt: ContractAuditEvent = {
      id: `evt_cnt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      actorUserId,
      actorCapability,
      workspaceId,
      sessionId,
      eventType: 'CONTRACT_SESSION_FORM_SELECTION_UPDATED',
      previousStatus: session.status,
      newStatus: session.status,
      timestamp: new Date().toISOString(),
      changedFieldNames: ['selectedForms'],
      reasonCodes: forms.map(f => f.formId),
      sourceChannel: session.channel
    };

    await defaultContractRepository.save(session);
    await defaultContractRepository.saveAuditEvent(formAuditEvt);
    return session;
  }

  /**
   * Execute deterministic validation and update session status accordingly.
   */
  public static async validateSession(
    sessionId: string,
    workspaceId: string,
    actorUserId: string,
    actorCapability: string = 'contract_authoring'
  ): Promise<ContractIntakeSession> {
    const session = await defaultContractRepository.findById(sessionId, workspaceId);
    if (!session) throw new Error(`Contract intake session '${sessionId}' not found.`);

    const { isValid, isBlocked, bicReviewRequired, issues } = ContractValidationEngine.validateSession(session);

    session.validationIssues = issues;
    session.bicReviewRequired = bicReviewRequired;

    let targetStatus: any = 'validation_required';

    if (session.status === 'terms_confirmation_required') {
      const t0 = ContractStateMachine.transition({ session, targetStatus: 'form_selection_required', actorUserId, actorCapability });
      await defaultContractRepository.saveAuditEvent(t0.auditEvent);
    }

    if (['form_selection_required', 'terms_collecting'].includes(session.status)) {
      const t1 = ContractStateMachine.transition({ session, targetStatus: 'validation_required', actorUserId, actorCapability });
      await defaultContractRepository.saveAuditEvent(t1.auditEvent);
    }

    if (isBlocked) {
      targetStatus = 'validation_blocked';
    } else if (bicReviewRequired) {
      targetStatus = 'bic_review_required';
    } else if (isValid) {
      targetStatus = 'draft_requested';
    }

    const { updatedSession, auditEvent } = ContractStateMachine.transition({
      session,
      targetStatus,
      actorUserId,
      actorCapability
    });

    if (targetStatus === 'draft_requested') {
      ContractFormsConfigService.assertLicensedFormsProviderConfigured(workspaceId);
      const manifest = MockContractFormProvider.generateMockDraftManifest(updatedSession);
      updatedSession.draftManifest = manifest;

      const t2 = ContractStateMachine.transition({ session: updatedSession, targetStatus: 'draft_ready', actorUserId, actorCapability });
      await defaultContractRepository.saveAuditEvent(t2.auditEvent);

      const t3 = ContractStateMachine.transition({ session: updatedSession, targetStatus: 'broker_review_required', actorUserId, actorCapability });
      await defaultContractRepository.saveAuditEvent(t3.auditEvent);
    }

    await defaultContractRepository.save(updatedSession);
    await defaultContractRepository.saveAuditEvent(auditEvent);

    return updatedSession;
  }

  /**
   * Request BIC Review explicitly.
   */
  public static async requestBicReview(
    sessionId: string,
    workspaceId: string,
    reason: string,
    actorUserId: string,
    actorCapability: string = 'contract_authoring'
  ): Promise<ContractIntakeSession> {
    const session = await defaultContractRepository.findById(sessionId, workspaceId);
    if (!session) throw new Error(`Contract intake session '${sessionId}' not found.`);

    session.bicReviewRequired = true;
    session.bicReviewReason = reason;

    const { updatedSession, auditEvent } = ContractStateMachine.transition({
      session,
      targetStatus: 'bic_review_required',
      actorUserId,
      actorCapability,
      reasonCode: 'MANUAL_BIC_REVIEW_REQUESTED'
    });

    await defaultContractRepository.save(updatedSession);
    await defaultContractRepository.saveAuditEvent(auditEvent);
    return updatedSession;
  }

  /**
   * Request draft manifest generation (or BIC approval resolution).
   */
  public static async requestDraft(
    sessionId: string,
    workspaceId: string,
    actorUserId: string,
    actorCapability: string
  ): Promise<ContractIntakeSession> {
    const session = await defaultContractRepository.findById(sessionId, workspaceId);
    if (!session) throw new Error(`Contract intake session '${sessionId}' not found.`);

    if (session.status === 'bic_review_required') {
      if (actorCapability !== 'contract_bic_review') {
        throw new Error('FORBIDDEN_BIC_CAPABILITY_REQUIRED: BIC Exception Review approval requires explicit contract_bic_review capability.');
      }
      const t1 = ContractStateMachine.transition({ session, targetStatus: 'draft_requested', actorUserId, actorCapability });
      await defaultContractRepository.saveAuditEvent(t1.auditEvent);
    } else if (session.status === 'validation_required') {
      const t1 = ContractStateMachine.transition({ session, targetStatus: 'draft_requested', actorUserId, actorCapability });
      await defaultContractRepository.saveAuditEvent(t1.auditEvent);
    } else if (!['draft_requested', 'draft_ready', 'broker_review_required'].includes(session.status)) {
      throw new Error(`Cannot request draft from status '${session.status}'. Must be validated or BIC approved.`);
    }

    if (session.status === 'draft_requested') {
      ContractFormsConfigService.assertLicensedFormsProviderConfigured(workspaceId);
      const manifest = MockContractFormProvider.generateMockDraftManifest(session);
      session.draftManifest = manifest;

      const t2 = ContractStateMachine.transition({ session, targetStatus: 'draft_ready', actorUserId, actorCapability });
      await defaultContractRepository.saveAuditEvent(t2.auditEvent);

      const t3 = ContractStateMachine.transition({ session, targetStatus: 'broker_review_required', actorUserId, actorCapability });
      await defaultContractRepository.saveAuditEvent(t3.auditEvent);
    }

    await defaultContractRepository.save(session);
    return session;
  }

  /**
   * Broker approves draft manifest.
   */
  public static async approveDraft(
    sessionId: string,
    workspaceId: string,
    actorUserId: string,
    actorCapability: string = 'contract_authoring'
  ): Promise<ContractIntakeSession> {
    const session = await defaultContractRepository.findById(sessionId, workspaceId);
    if (!session) throw new Error(`Contract intake session '${sessionId}' not found.`);

    if (session.status !== 'broker_review_required') {
      throw new Error(`Cannot approve draft from status '${session.status}'. Must be in 'broker_review_required'.`);
    }

    session.brokerApprovalStatus = 'approved';

    const { updatedSession, auditEvent } = ContractStateMachine.transition({
      session,
      targetStatus: 'broker_approved',
      actorUserId,
      actorCapability
    });

    await defaultContractRepository.save(updatedSession);
    await defaultContractRepository.saveAuditEvent(auditEvent);
    return updatedSession;
  }

  /**
   * Cancel session.
   */
  public static async cancelSession(
    sessionId: string,
    workspaceId: string,
    reason: string,
    actorUserId: string,
    actorCapability: string = 'contract_authoring'
  ): Promise<ContractIntakeSession> {
    const session = await defaultContractRepository.findById(sessionId, workspaceId);
    if (!session) throw new Error(`Contract intake session '${sessionId}' not found.`);

    const { updatedSession, auditEvent } = ContractStateMachine.transition({
      session,
      targetStatus: 'cancelled',
      actorUserId,
      actorCapability,
      reasonCode: reason || 'USER_CANCELLED'
    });

    await defaultContractRepository.save(updatedSession);
    await defaultContractRepository.saveAuditEvent(auditEvent);
    return updatedSession;
  }

  /**
   * Get session by ID.
   */
  public static async getSession(sessionId: string, workspaceId: string): Promise<ContractIntakeSession | null> {
    return defaultContractRepository.findById(sessionId, workspaceId);
  }
}
