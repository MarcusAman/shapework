import crypto from 'crypto';

export interface SopAuthoringRequest {
  id: string;
  workspaceId: string;
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  employeeEmail: string;
  assignmentType: 'known_process' | 'role_discovery';
  processName?: string;
  processContext?: string;
  department?: string;
  location?: string;
  applicableRoles?: string[];
  startingMethod?: 'blank' | 'template' | 'duplicate' | 'nora_guided';
  discoverySourceIds: string[];
  starterDraftId?: string;
  requestedByUserId: string;
  requestedByName: string;
  processOwnerName?: string;
  reviewerUserId?: string;
  reviewerName?: string;
  bicReviewerUserId?: string;
  bicReviewerName?: string;
  finalApproverUserId?: string;
  finalApproverName?: string;
  publisherUserId?: string;
  publisherName?: string;
  dueDate?: string;
  requestedReviewDate?: string;
  riskLevel?: 'low' | 'standard' | 'compliance_sensitive';
  requiresBicReview?: boolean;
  instructions?: string;
  status:
    | 'draft'
    | 'ready_to_send'
    | 'sent'
    | 'opened'
    | 'in_progress'
    | 'submitted'
    | 'changes_requested'
    | 'bic_approved'
    | 'approved'
    | 'published'
    | 'expired'
    | 'revoked'
    | 'cancelled';
  invitationToken: string; // raw token returned only on creation/resend
  tokenHash: string; // sha256 digest
  tokenExpiresAt: string;
  revokedAt?: string;
  submittedAt?: string;
  approvedAt?: string;
  publishedAt?: string;
  invitationUrl: string;
  resultingSopDraftIds: string[];
  reviewNotes?: string;
  priorStarterDraftId?: string;
  createdAt: string;
  updatedAt: string;
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

class SopAuthoringRequestRepository {
  private requestsMap = new Map<string, SopAuthoringRequest>();
  private hashToIdMap = new Map<string, string>();

  constructor() {
    this.seedInitialRequests();
  }

  private seedInitialRequests() {
    const rawToken1 = 'inv_tok_melissa_da_audit_2026';
    const hash1 = hashToken(rawToken1);
    const expiresAt1 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const seeded1: SopAuthoringRequest = {
      id: 'req_melissa_da_verification',
      workspaceId: 'nest-realty-wilmington',
      employeeId: 'usr_melissa',
      employeeName: 'Melissa Gagliardi',
      employeeRole: 'Marketing Coordinator & Operations Lead',
      employeeEmail: 'melissa@nestrealty.com',
      assignmentType: 'known_process',
      processName: 'Commission DA Verification & Escrow Audit Procedure',
      processContext: 'Verify seller digital signature, agent splits against NCREC rules, and earnest money receipts before payout.',
      department: 'Closing & Escrow',
      location: 'Mayfaire & Carolina Beach',
      applicableRoles: ['Transaction Coordinator', 'Marketing Coordinator'],
      startingMethod: 'nora_guided',
      discoverySourceIds: ['disc_sop_da_01'],
      starterDraftId: 'sop_melissa_101',
      requestedByUserId: 'usr_ryan',
      requestedByName: 'Ryan Crecelius',
      processOwnerName: 'Melissa Gagliardi',
      reviewerUserId: 'usr_eric',
      reviewerName: 'Eric Knight',
      bicReviewerUserId: 'usr_eric',
      bicReviewerName: 'Eric Knight (BIC)',
      finalApproverUserId: 'usr_ryan',
      finalApproverName: 'Ryan Crecelius',
      dueDate: '2026-08-30',
      riskLevel: 'compliance_sensitive',
      requiresBicReview: true,
      instructions: 'Please verify earnest money escrow accounting against NCREC rules.',
      status: 'in_progress',
      invitationToken: rawToken1,
      tokenHash: hash1,
      tokenExpiresAt: expiresAt1,
      invitationUrl: `http://localhost:3049/author/sop/${rawToken1}`,
      resultingSopDraftIds: ['sop_melissa_101'],
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date().toISOString()
    };

    const rawToken2 = 'inv_tok_melissa_role_discovery_2026';
    const hash2 = hashToken(rawToken2);
    const expiresAt2 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const seeded2: SopAuthoringRequest = {
      id: 'req_melissa_role_discovery',
      workspaceId: 'nest-realty-wilmington',
      employeeId: 'usr_melissa',
      employeeName: 'Melissa Gagliardi',
      employeeRole: 'Marketing Coordinator & Operations Lead',
      employeeEmail: 'melissa@nestrealty.com',
      assignmentType: 'role_discovery',
      processName: 'Role-Based Process Discovery & SOP Mapping',
      processContext: 'Identify all recurring operational processes Melissa handles weekly or per transaction.',
      department: 'Marketing & Ops',
      location: 'All Offices',
      applicableRoles: ['Marketing Coordinator'],
      startingMethod: 'nora_guided',
      discoverySourceIds: [],
      requestedByUserId: 'usr_ryan',
      requestedByName: 'Ryan Crecelius',
      processOwnerName: 'Melissa Gagliardi',
      reviewerUserId: 'usr_ryan',
      reviewerName: 'Ryan Crecelius',
      finalApproverUserId: 'usr_ryan',
      finalApproverName: 'Ryan Crecelius',
      dueDate: '2026-09-05',
      riskLevel: 'standard',
      requiresBicReview: false,
      status: 'sent',
      invitationToken: rawToken2,
      tokenHash: hash2,
      tokenExpiresAt: expiresAt2,
      invitationUrl: `http://localhost:3049/author/sop/${rawToken2}`,
      resultingSopDraftIds: [],
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.requestsMap.set(seeded1.id, seeded1);
    this.hashToIdMap.set(hash1, seeded1.id);

    this.requestsMap.set(seeded2.id, seeded2);
    this.hashToIdMap.set(hash2, seeded2.id);
  }

  public async listRequests(workspaceId: string): Promise<SopAuthoringRequest[]> {
    const list: SopAuthoringRequest[] = [];
    for (const req of this.requestsMap.values()) {
      if (req.workspaceId === workspaceId || !workspaceId || workspaceId === 'nest-realty-demo') {
        // Redact raw invitationToken in list view for security hygiene
        list.push({ ...req, invitationToken: '' });
      }
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async getById(id: string): Promise<SopAuthoringRequest | null> {
    const found = this.requestsMap.get(id);
    return found ? { ...found } : null;
  }

  public async getByToken(rawToken: string): Promise<SopAuthoringRequest | null> {
    if (!rawToken) return null;
    const hash = hashToken(rawToken);
    const id = this.hashToIdMap.get(hash);
    if (!id) return null;
    const found = this.requestsMap.get(id);
    if (!found) return null;

    // Check expiration and revocation
    const isExpired = new Date(found.tokenExpiresAt).getTime() < Date.now();
    const isRevoked = !!found.revokedAt;

    if (isRevoked) {
      return { ...found, status: 'revoked' };
    }
    if (isExpired && found.status === 'sent') {
      return { ...found, status: 'expired' };
    }

    return { ...found };
  }

  public async createRequest(params: Partial<SopAuthoringRequest>): Promise<SopAuthoringRequest> {
    const id = `req_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const rawToken = `inv_sop_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`;
    const tokenHash = hashToken(rawToken);
    const now = new Date().toISOString();
    const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    const requiresBic = params.requiresBicReview || params.riskLevel === 'compliance_sensitive';

    const newReq: SopAuthoringRequest = {
      id,
      workspaceId: params.workspaceId || 'nest-realty-wilmington',
      employeeId: params.employeeId || 'usr_employee',
      employeeName: params.employeeName || 'Staff Member',
      employeeRole: params.employeeRole || 'Operations Staff',
      employeeEmail: (params.employeeEmail || 'staff@nestrealty.com').toLowerCase().trim(),
      assignmentType: params.assignmentType || 'known_process',
      processName: params.processName || 'Standard Operational Procedure',
      processContext: params.processContext || '',
      department: params.department || 'Operations',
      location: params.location || 'All Offices',
      applicableRoles: params.applicableRoles || [],
      startingMethod: params.startingMethod || 'nora_guided',
      discoverySourceIds: params.discoverySourceIds || [],
      starterDraftId: params.starterDraftId,
      requestedByUserId: params.requestedByUserId || 'usr_ryan',
      requestedByName: params.requestedByName || 'Ryan Crecelius',
      processOwnerName: params.processOwnerName || params.employeeName || 'Staff Member',
      reviewerUserId: params.reviewerUserId || 'usr_ryan',
      reviewerName: params.reviewerName || 'Ryan Crecelius',
      bicReviewerUserId: requiresBic ? (params.bicReviewerUserId || 'usr_eric') : undefined,
      bicReviewerName: requiresBic ? (params.bicReviewerName || 'Eric Knight (BIC)') : undefined,
      finalApproverUserId: params.finalApproverUserId || 'usr_ryan',
      finalApproverName: params.finalApproverName || 'Ryan Crecelius',
      dueDate: params.dueDate,
      requestedReviewDate: params.requestedReviewDate,
      riskLevel: params.riskLevel || (requiresBic ? 'compliance_sensitive' : 'standard'),
      requiresBicReview: requiresBic,
      instructions: params.instructions || '',
      status: 'sent',
      invitationToken: rawToken,
      tokenHash,
      tokenExpiresAt,
      invitationUrl: `http://localhost:3049/author/sop/${rawToken}`,
      resultingSopDraftIds: params.resultingSopDraftIds || [],
      createdAt: now,
      updatedAt: now
    };

    this.requestsMap.set(id, newReq);
    this.hashToIdMap.set(tokenHash, id);

    if (typeof window === 'undefined') {
      try {
        const { dbPool } = await import('./repositories.js');
        if (dbPool) {
          await dbPool.query(`
            INSERT INTO sop_authoring_requests (
              id, workspace_id, employee_id, employee_name, employee_role, employee_email,
              assignment_type, process_name, process_context, department, location, applicable_roles,
              starting_method, starter_draft_id, requested_by_user_id, requested_by_name,
              process_owner_name, reviewer_user_id, reviewer_name, bic_reviewer_user_id, bic_reviewer_name,
              final_approver_user_id, final_approver_name, due_date, requested_review_date,
              risk_level, requires_bic_review, instructions, status, token_hash, token_expires_at,
              created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, NOW(), NOW())
          `, [
            newReq.id, newReq.workspaceId, newReq.employeeId, newReq.employeeName, newReq.employeeRole, newReq.employeeEmail,
            newReq.assignmentType, newReq.processName, newReq.processContext, newReq.department, newReq.location, newReq.applicableRoles,
            newReq.startingMethod, newReq.starterDraftId || null, newReq.requestedByUserId, newReq.requestedByName,
            newReq.processOwnerName, newReq.reviewerUserId, newReq.reviewerName, newReq.bicReviewerUserId || null, newReq.bicReviewerName || null,
            newReq.finalApproverUserId, newReq.finalApproverName, newReq.dueDate || null, newReq.requestedReviewDate || null,
            newReq.riskLevel, newReq.requiresBicReview, newReq.instructions, newReq.status, newReq.tokenHash, newReq.tokenExpiresAt
          ]);
        }
      } catch (err) {
        console.error('[SopAuthoringRepo] DB insert error (non-fatal, kept in memory):', err);
      }
    }

    return { ...newReq };
  }

  public async updateRequest(id: string, updates: Partial<SopAuthoringRequest>): Promise<SopAuthoringRequest | null> {
    const existing = this.requestsMap.get(id);
    if (!existing) return null;

    const updated: SopAuthoringRequest = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.requestsMap.set(id, updated);

    if (typeof window === 'undefined') {
      try {
        const { dbPool } = await import('./repositories.js');
        if (dbPool) {
          await dbPool.query(`
            UPDATE sop_authoring_requests
            SET status = COALESCE($1, status),
                review_notes = COALESCE($2, review_notes),
                submitted_at = COALESCE($3, submitted_at),
                approved_at = COALESCE($4, approved_at),
                published_at = COALESCE($5, published_at),
                revoked_at = COALESCE($6, revoked_at),
              updated_at = NOW()
          WHERE id = $7
        `, [
          updates.status || null,
          updates.reviewNotes || null,
          updates.submittedAt ? new Date(updates.submittedAt) : null,
          updates.approvedAt ? new Date(updates.approvedAt) : null,
          updates.publishedAt ? new Date(updates.publishedAt) : null,
          updates.revokedAt ? new Date(updates.revokedAt) : null,
          id
        ]);
        }
      } catch (err) {
        console.error('[SopAuthoringRepo] DB update error:', err);
      }
    }

    return { ...updated };
  }

  public async resendRequest(id: string): Promise<SopAuthoringRequest | null> {
    const existing = this.requestsMap.get(id);
    if (!existing) return null;

    // Invalidate old token
    this.hashToIdMap.delete(existing.tokenHash);

    const newRawToken = `inv_sop_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`;
    const newTokenHash = hashToken(newRawToken);
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const updated: SopAuthoringRequest = {
      ...existing,
      invitationToken: newRawToken,
      tokenHash: newTokenHash,
      tokenExpiresAt: newExpiresAt,
      revokedAt: undefined,
      status: 'sent',
      invitationUrl: `http://localhost:3049/author/sop/${newRawToken}`,
      updatedAt: new Date().toISOString()
    };

    this.requestsMap.set(id, updated);
    this.hashToIdMap.set(newTokenHash, id);

    return { ...updated };
  }

  public async revokeRequest(id: string): Promise<SopAuthoringRequest | null> {
    const existing = this.requestsMap.get(id);
    if (!existing) return null;

    const updated: SopAuthoringRequest = {
      ...existing,
      status: 'revoked',
      revokedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.requestsMap.set(id, updated);
    return { ...updated };
  }

  public async handleDraftDeleted(sopDraftId: string, removedBy: string = 'system'): Promise<void> {
    for (const req of this.requestsMap.values()) {
      let changed = false;
      const updates: Partial<SopAuthoringRequest> = {};

      if (req.starterDraftId === sopDraftId) {
        updates.priorStarterDraftId = sopDraftId;
        updates.starterDraftId = undefined;
        changed = true;
      }

      if (req.resultingSopDraftIds && req.resultingSopDraftIds.includes(sopDraftId)) {
        updates.resultingSopDraftIds = req.resultingSopDraftIds.filter(id => id !== sopDraftId);
        changed = true;
      }

      if (changed) {
        const auditNote = `[${new Date().toISOString()}] Working draft "${sopDraftId}" was removed by ${removedBy}. Historical authoring request preserved.`;
        updates.reviewNotes = req.reviewNotes ? `${req.reviewNotes}\n${auditNote}` : auditNote;
        if (req.status === 'in_progress' && updates.resultingSopDraftIds?.length === 0) {
          updates.status = 'sent';
        }
        await this.updateRequest(req.id, updates);
      }
    }
  }
}

export const sopAuthoringRequestRepository = new SopAuthoringRequestRepository();
