import { describe, it, expect } from 'vitest';
import { sopAuthoringRequestRepository } from '../server/persistence/sopAuthoringRequestRepository';

describe('SOP Authoring Request Workflow & Token Security', () => {
  it('creates a new SOP authoring request with secure random invitation token', async () => {
    const req = await sopAuthoringRequestRepository.createRequest({
      workspaceId: 'nest-realty-wilmington',
      employeeId: 'usr_melissa',
      employeeName: 'Melissa Gagliardi',
      employeeRole: 'Marketing Coordinator',
      employeeEmail: 'melissa@nestrealty.com',
      assignmentType: 'known_process',
      processName: 'Commission DA Verification Procedure',
      requestedByUserId: 'usr_ryan',
      requestedByName: 'Ryan Crecelius',
      reviewerUserId: 'usr_eric',
      reviewerName: 'Eric Knight'
    });

    expect(req.id).toMatch(/^req_/);
    expect(req.invitationToken).toMatch(/^inv_tok_/);
    expect(req.status).toBe('sent');
    expect(req.invitationUrl).toContain('/author/sop/');
  });

  it('retrieves authoring request by token without requiring global admin login', async () => {
    const req = await sopAuthoringRequestRepository.createRequest({
      workspaceId: 'nest-realty-wilmington',
      employeeName: 'Ann Gunn',
      assignmentType: 'role_discovery'
    });

    const fetched = await sopAuthoringRequestRepository.getByToken(req.invitationToken);
    expect(fetched).not.toBeNull();
    expect(fetched?.employeeName).toBe('Ann Gunn');
    expect(fetched?.assignmentType).toBe('role_discovery');
  });

  it('handles state transitions: sent -> in_progress -> submitted -> published', async () => {
    const req = await sopAuthoringRequestRepository.createRequest({
      employeeName: 'Melissa Gagliardi',
      processName: 'Escrow Audit'
    });

    // 1. Employee opens link
    const opened = await sopAuthoringRequestRepository.updateRequest(req.id, { status: 'opened' });
    expect(opened?.status).toBe('opened');

    // 2. Employee starts interview
    const inProgress = await sopAuthoringRequestRepository.updateRequest(req.id, { status: 'in_progress' });
    expect(inProgress?.status).toBe('in_progress');

    // 3. Employee submits draft for review
    const submitted = await sopAuthoringRequestRepository.updateRequest(req.id, { status: 'submitted' });
    expect(submitted?.status).toBe('submitted');

    // 4. Reviewer approves & publishes
    const published = await sopAuthoringRequestRepository.updateRequest(req.id, {
      status: 'published',
      publisherUserId: 'usr_ryan',
      priorStarterDraftId: 'sop_starter_001'
    });
    expect(published?.status).toBe('published');
    expect(published?.priorStarterDraftId).toBe('sop_starter_001');
  });
});
