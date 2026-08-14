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
  discoverySourceIds: string[];
  starterDraftId?: string;
  requestedByUserId: string;
  requestedByName: string;
  reviewerUserId?: string;
  reviewerName?: string;
  publisherUserId?: string;
  dueDate?: string;
  status:
    | 'draft'
    | 'ready_to_send'
    | 'sent'
    | 'opened'
    | 'in_progress'
    | 'submitted'
    | 'changes_requested'
    | 'approved'
    | 'published'
    | 'expired'
    | 'cancelled';
  invitationToken: string;
  invitationUrl: string;
  resultingSopDraftIds: string[];
  reviewNotes?: string;
  priorStarterDraftId?: string;
  createdAt: string;
  updatedAt: string;
}

class SopAuthoringRequestRepository {
  private requestsMap = new Map<string, SopAuthoringRequest>();
  private tokenToIdMap = new Map<string, string>();

  constructor() {
    this.seedInitialRequests();
  }

  private seedInitialRequests() {
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
      discoverySourceIds: ['disc_sop_da_01'],
      starterDraftId: 'sop_melissa_101',
      requestedByUserId: 'usr_ryan',
      requestedByName: 'Ryan Crecelius',
      reviewerUserId: 'usr_eric',
      reviewerName: 'Eric Knight',
      dueDate: '2026-08-15',
      status: 'in_progress',
      invitationToken: 'inv_tok_melissa_da_audit_2026',
      invitationUrl: 'http://localhost:3049/author/sop/inv_tok_melissa_da_audit_2026',
      resultingSopDraftIds: ['sop_melissa_101'],
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date().toISOString()
    };

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
      discoverySourceIds: [],
      requestedByUserId: 'usr_ryan',
      requestedByName: 'Ryan Crecelius',
      reviewerUserId: 'usr_ryan',
      reviewerName: 'Ryan Crecelius',
      dueDate: '2026-08-20',
      status: 'sent',
      invitationToken: 'inv_tok_melissa_role_discovery_2026',
      invitationUrl: 'http://localhost:3049/author/sop/inv_tok_melissa_role_discovery_2026',
      resultingSopDraftIds: [],
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.requestsMap.set(seeded1.id, seeded1);
    this.tokenToIdMap.set(seeded1.invitationToken, seeded1.id);

    this.requestsMap.set(seeded2.id, seeded2);
    this.tokenToIdMap.set(seeded2.invitationToken, seeded2.id);
  }

  public async listRequests(workspaceId: string): Promise<SopAuthoringRequest[]> {
    const list: SopAuthoringRequest[] = [];
    for (const req of this.requestsMap.values()) {
      if (req.workspaceId === workspaceId || !workspaceId) {
        list.push({ ...req });
      }
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async getById(id: string): Promise<SopAuthoringRequest | null> {
    const found = this.requestsMap.get(id);
    return found ? { ...found } : null;
  }

  public async getByToken(token: string): Promise<SopAuthoringRequest | null> {
    const id = this.tokenToIdMap.get(token);
    if (!id) return null;
    return this.getById(id);
  }

  public async createRequest(params: Partial<SopAuthoringRequest>): Promise<SopAuthoringRequest> {
    const id = `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const token = `inv_tok_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date().toISOString();

    const newReq: SopAuthoringRequest = {
      id,
      workspaceId: params.workspaceId || 'nest-realty-wilmington',
      employeeId: params.employeeId || 'usr_employee',
      employeeName: params.employeeName || 'Staff Member',
      employeeRole: params.employeeRole || 'Operations Staff',
      employeeEmail: params.employeeEmail || 'staff@nestrealty.com',
      assignmentType: params.assignmentType || 'known_process',
      processName: params.processName || '',
      processContext: params.processContext || '',
      discoverySourceIds: params.discoverySourceIds || [],
      starterDraftId: params.starterDraftId,
      requestedByUserId: params.requestedByUserId || 'usr_ryan',
      requestedByName: params.requestedByName || 'Ryan Crecelius',
      reviewerUserId: params.reviewerUserId || 'usr_ryan',
      reviewerName: params.reviewerName || 'Ryan Crecelius',
      dueDate: params.dueDate,
      status: 'sent',
      invitationToken: token,
      invitationUrl: `http://localhost:3049/author/sop/${token}`,
      resultingSopDraftIds: params.resultingSopDraftIds || [],
      createdAt: now,
      updatedAt: now
    };

    this.requestsMap.set(id, newReq);
    this.tokenToIdMap.set(token, id);
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
          updates.status = 'sent'; // Allow restarting/creating a replacement draft
        }
        await this.updateRequest(req.id, updates);
      }
    }
  }
}

export const sopAuthoringRequestRepository = new SopAuthoringRequestRepository();
