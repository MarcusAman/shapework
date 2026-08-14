/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * External Intake Quarantine & Pending Contract Intake Subsystem — Phase 4A.2 Architecture
 * Quarantines unverified external channel inputs (phone, SMS, email) as PendingContractIntake records.
 * Prevents unverified inputs from mutating canonical ContractIntakeSession models until claimed
 * and verified by an authenticated broker possessing contract_authoring capability.
 */

import { ContractChannel, ContractTerms, PropertyAddress, TransactionParty, ContractValidationIssue, ContractIntakeSession } from './contractDomainTypes.js';
import { ContractService } from './contractService.js';
import { defaultContractRepository } from './contractRepository.js';

export type TransportStatus = 'unverified' | 'verified' | 'failed';
export type BrokerIdentityStatus = 'unidentified' | 'candidate_identified' | 'verification_required' | 'verified' | 'revoked';
export type AuthorizationStatus = 'not_evaluated' | 'authorized' | 'denied';
export type ClaimStatus = 'pending' | 'claimed' | 'expired' | 'rejected';

export interface PendingContractIntake {
  id: string;
  workspaceId: string;
  channel: ContractChannel;
  transportStatus: TransportStatus;
  brokerIdentityStatus: BrokerIdentityStatus;
  authorizationStatus: AuthorizationStatus;
  claimStatus: ClaimStatus;
  candidateUserId: string;
  candidatePhone?: string;
  candidateEmail?: string;
  proposedTerms: Partial<ContractTerms>;
  proposedProperty?: PropertyAddress;
  proposedParties?: TransactionParty[];
  bicReviewRequired: boolean;
  bicReviewReason?: string;
  validationIssues: ContractValidationIssue[];
  verificationChallengeToken: string;
  correlationId: string;
  idempotencyKey: string;
  createdAt: string;
  expiresAt: string;
  claimedByUserId?: string;
  claimedAt?: string;
  targetContractSessionId?: string;
}

export class PendingContractIntakeService {
  private static pendingStore: Map<string, PendingContractIntake> = new Map();

  /**
   * Quarantines an unverified external intake as a PendingContractIntake record.
   */
  public static async createPendingIntake(params: {
    workspaceId: string;
    channel: ContractChannel;
    transportStatus: TransportStatus;
    candidateUserId: string;
    candidatePhone?: string;
    candidateEmail?: string;
    proposedTerms: Partial<ContractTerms>;
    proposedProperty?: PropertyAddress;
    proposedParties?: TransactionParty[];
    bicReviewRequired?: boolean;
    bicReviewReason?: string;
    validationIssues?: ContractValidationIssue[];
    correlationId: string;
    idempotencyKey: string;
  }): Promise<PendingContractIntake> {
    const {
      workspaceId,
      channel,
      transportStatus,
      candidateUserId,
      candidatePhone,
      candidateEmail,
      proposedTerms,
      proposedProperty,
      proposedParties,
      bicReviewRequired = false,
      bicReviewReason,
      validationIssues = [],
      correlationId,
      idempotencyKey
    } = params;

    // Idempotency check: Return existing pending record if already created for this key
    for (const item of this.pendingStore.values()) {
      if (item.workspaceId === workspaceId && item.idempotencyKey === idempotencyKey) {
        return item;
      }
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(); // 24-hour expiration
    const id = `pend_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const challengeToken = `tok_ver_${Math.random().toString(36).substring(2, 10)}`;

    const pending: PendingContractIntake = {
      id,
      workspaceId,
      channel,
      transportStatus,
      brokerIdentityStatus: 'verification_required',
      authorizationStatus: 'not_evaluated',
      claimStatus: 'pending',
      candidateUserId,
      candidatePhone,
      candidateEmail,
      proposedTerms,
      proposedProperty,
      proposedParties,
      bicReviewRequired,
      bicReviewReason,
      validationIssues,
      verificationChallengeToken: challengeToken,
      correlationId,
      idempotencyKey,
      createdAt: now.toISOString(),
      expiresAt
    };

    this.pendingStore.set(id, pending);
    return pending;
  }

  public static async getPendingIntake(id: string, workspaceId: string): Promise<PendingContractIntake | null> {
    const item = this.pendingStore.get(id);
    if (!item || item.workspaceId !== workspaceId) return null;
    return { ...item };
  }

  public static async listPendingByBroker(candidateUserId: string, workspaceId: string): Promise<PendingContractIntake[]> {
    const result: PendingContractIntake[] = [];
    for (const item of this.pendingStore.values()) {
      if (item.workspaceId === workspaceId && item.candidateUserId === candidateUserId && item.claimStatus === 'pending') {
        result.push({ ...item });
      }
    }
    return result;
  }

  /**
   * Authenticated broker claims their pending contract intake and merges facts into canonical ContractIntakeSession.
   */
  public static async claimPendingIntake(params: {
    pendingIntakeId: string;
    workspaceId: string;
    requestingUserId: string;
    actorCapability: string;
  }): Promise<ContractIntakeSession> {
    const { pendingIntakeId, workspaceId, requestingUserId, actorCapability } = params;

    const pending = this.pendingStore.get(pendingIntakeId);
    if (!pending) {
      throw new Error(`PENDING_INTAKE_NOT_FOUND: Pending contract intake '${pendingIntakeId}' does not exist.`);
    }

    // 1. Cross-Workspace Protection
    if (pending.workspaceId !== workspaceId) {
      throw new Error(`CROSS_WORKSPACE_CLAIM_DENIED: Pending intake '${pendingIntakeId}' belongs to workspace '${pending.workspaceId}', not '${workspaceId}'.`);
    }

    // 2. Unauthorized Broker Claim Protection
    if (pending.candidateUserId !== requestingUserId) {
      throw new Error(`UNAUTHORIZED_CLAIM_DENIED: User '${requestingUserId}' is not authorized to claim pending intake associated with candidate broker '${pending.candidateUserId}'.`);
    }

    // 3. Capability Check
    if (actorCapability !== 'contract_authoring' && actorCapability !== 'contract_bic_review') {
      throw new Error(`FORBIDDEN_CONTRACT_AUTHORING: User '${requestingUserId}' lacks contract_authoring capability to claim intake.`);
    }

    // 4. Prevent Double-Claiming
    if (pending.claimStatus === 'claimed') {
      if (pending.targetContractSessionId) {
        const existingSession = await defaultContractRepository.findById(pending.targetContractSessionId, workspaceId);
        if (existingSession) return existingSession;
      }
      throw new Error(`DOUBLE_CLAIM_PREVENTED: Pending intake '${pendingIntakeId}' has already been claimed.`);
    }

    // 5. Multi-Channel Continuity: Find or Create Active Canonical Session
    const existingSessions = await defaultContractRepository.listByWorkspace(workspaceId);
    let session = existingSessions.find(
      s => s.requestingBrokerId === requestingUserId && !['broker_approved', 'cancelled'].includes(s.status)
    );

    if (!session) {
      session = await ContractService.createSession({
        workspaceId,
        requestingUserId,
        requestingBrokerId: requestingUserId,
        channel: pending.channel,
        actorCapability
      });
    }

    // 6. Merge Property Address if supplied
    if (pending.proposedProperty) {
      session.property = { ...pending.proposedProperty };
    }

    // 7. Merge Parties if supplied
    if (pending.proposedParties && pending.proposedParties.length > 0) {
      for (const party of pending.proposedParties) {
        if (!session.parties.some(p => p.fullName === party.fullName)) {
          session.parties.push({ ...party });
        }
      }
    }

    // 8. Merge Terms via ContractService
    session = await ContractService.updateTerms(
      session.id,
      workspaceId,
      pending.proposedTerms,
      [{
        fieldPath: 'terms',
        sourceType: 'manual_entry',
        sourceDocName: `Claimed Pending Intake (${pending.channel})`,
        sourceTimestamp: new Date().toISOString(),
        suppliedByUserId: requestingUserId,
        verificationStatus: 'verified',
        conflictStatus: 'no_conflict',
        factualNotes: `Claimed and verified by broker ${requestingUserId}`
      }],
      requestingUserId,
      actorCapability
    );

    // 9. Preserve BIC Review Escalations
    if (pending.bicReviewRequired) {
      session = await ContractService.requestBicReview(
        session.id,
        workspaceId,
        pending.bicReviewReason || 'BIC review required from pending intake claim.',
        requestingUserId,
        actorCapability
      );
    }

    // 10. Update Pending Status
    pending.claimStatus = 'claimed';
    pending.brokerIdentityStatus = 'verified';
    pending.authorizationStatus = 'authorized';
    pending.claimedByUserId = requestingUserId;
    pending.claimedAt = new Date().toISOString();
    pending.targetContractSessionId = session.id;

    this.pendingStore.set(pendingIntakeId, pending);
    return session;
  }

  public static clearForTesting(): void {
    this.pendingStore.clear();
  }
}
