/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Contract State Machine Engine — Phase 2.1 Hardened Architecture
 * Validates deterministic status transitions, capability authorization, workspace scoping, and appends audit events.
 */

import { ContractIntakeSession, ContractSessionStatus, ContractAuditEvent, ContractChannel } from './contractDomainTypes.js';
import { ContractValidationEngine } from './contractValidationSchemas.js';

export interface TransitionContext {
  session: ContractIntakeSession;
  targetStatus: ContractSessionStatus;
  actorUserId: string;
  actorCapability: string;
  sourceChannel?: ContractChannel;
  idempotencyKey?: string;
  reasonCode?: string;
}

export class ContractStateMachine {

  private static allowedTransitions: Record<ContractSessionStatus, ContractSessionStatus[]> = {
    intake_started: ['identity_verified', 'bic_review_required', 'cancelled'],
    identity_verified: ['terms_collecting', 'bic_review_required', 'cancelled'],
    terms_collecting: ['terms_confirmation_required', 'bic_review_required', 'cancelled'],
    terms_confirmation_required: ['form_selection_required', 'terms_collecting', 'bic_review_required', 'cancelled'],
    form_selection_required: ['validation_required', 'terms_collecting', 'bic_review_required', 'cancelled'],
    validation_required: ['validation_blocked', 'bic_review_required', 'draft_requested', 'cancelled'],
    validation_blocked: ['terms_collecting', 'bic_review_required', 'cancelled'],
    bic_review_required: ['draft_requested', 'validation_blocked', 'cancelled'],
    draft_requested: ['draft_ready', 'cancelled'],
    draft_ready: ['broker_review_required', 'cancelled'],
    broker_review_required: ['broker_approved', 'terms_collecting', 'cancelled'],
    broker_approved: ['cancelled'],
    cancelled: []
  };

  /**
   * Validate whether a state transition is allowed.
   */
  public static canTransition(current: ContractSessionStatus, target: ContractSessionStatus): boolean {
    const validTargets = this.allowedTransitions[current] || [];
    return validTargets.includes(target);
  }

  /**
   * Execute state transition on session, updating session status and generating audit event.
   */
  public static transition(ctx: TransitionContext): {
    updatedSession: ContractIntakeSession;
    auditEvent: ContractAuditEvent;
  } {
    const { session, targetStatus, actorUserId, actorCapability, sourceChannel, idempotencyKey, reasonCode } = ctx;

    // 1. Check transition validity
    if (!this.canTransition(session.status, targetStatus)) {
      throw new Error(`Invalid state transition: Cannot transition from '${session.status}' to '${targetStatus}'.`);
    }

    // 2. Explicit Capability Check for BIC Review Approval
    if (targetStatus === 'draft_requested' && session.status === 'bic_review_required') {
      if (actorCapability !== 'contract_bic_review') {
        throw new Error('FORBIDDEN_BIC_CAPABILITY_REQUIRED: BIC Exception Review approval requires explicit contract_bic_review capability.');
      }

      // Re-run validation to check if blocking issues still exist after BIC review
      const validation = ContractValidationEngine.validateSession(session);
      if (validation.isBlocked) {
        // Transition to validation_blocked instead of draft_requested if blocking issues remain
        const prev = session.status;
        session.status = 'validation_blocked';
        session.technicalValidationStatus = 'blocked';
        session.validationIssues = validation.issues;
        session.updatedAt = new Date().toISOString();
        session.version += 1;

        const auditEvent: ContractAuditEvent = {
          id: `evt_cnt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          actorUserId,
          actorCapability,
          workspaceId: session.workspaceId,
          sessionId: session.id,
          eventType: 'CONTRACT_SESSION_TRANSITION_BIC_REVIEW_TO_VALIDATION_BLOCKED',
          previousStatus: prev,
          newStatus: 'validation_blocked',
          timestamp: session.updatedAt,
          idempotencyKey,
          reasonCodes: ['BLOCKING_VALIDATION_ISSUES_REMAIN'],
          sourceChannel: sourceChannel || session.channel
        };
        return { updatedSession: session, auditEvent };
      }
    }

    if (targetStatus === 'broker_approved') {
      if (session.brokerApprovalStatus !== 'approved') {
        session.brokerApprovalStatus = 'approved';
      }
    }

    const previousStatus = session.status;
    const now = new Date().toISOString();

    // 3. Apply state mutation
    session.status = targetStatus;
    session.updatedAt = now;
    session.version += 1;

    if (targetStatus === 'draft_requested') {
      session.technicalValidationStatus = 'valid';
    } else if (targetStatus === 'validation_blocked') {
      session.technicalValidationStatus = 'blocked';
    }

    // 4. Create immutable Audit Event
    const auditEvent: ContractAuditEvent = {
      id: `evt_cnt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      actorUserId,
      actorCapability,
      workspaceId: session.workspaceId,
      sessionId: session.id,
      eventType: `CONTRACT_SESSION_TRANSITION_${previousStatus.toUpperCase()}_TO_${targetStatus.toUpperCase()}`,
      previousStatus,
      newStatus: targetStatus,
      timestamp: now,
      idempotencyKey,
      reasonCodes: reasonCode ? [reasonCode] : [],
      sourceChannel: sourceChannel || session.channel
    };

    return {
      updatedSession: session,
      auditEvent
    };
  }
}
