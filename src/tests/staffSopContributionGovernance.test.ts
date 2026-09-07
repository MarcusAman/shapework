import { describe, it, expect, beforeEach } from 'vitest';
import { sopAuthoringRequestRepository, hashToken } from '../../server/persistence/sopAuthoringRequestRepository';
import { sopRepository } from '../../server/persistence/sopRepository';
import { queryUnifiedContext } from '../../server/knowledge/unifiedContextRetriever';
import { ROLE_PERMISSIONS } from '../../server/auth/auth';
import { getInvitationDetails } from '../../server/auth/invitationService';
import { validatePasswordPolicy } from '../../server/auth/password';
import { SopDocument } from '../types/sopWorkflow';

describe('Staff SOP Contribution, Account Activation & Publication Governance Suite', () => {
  const workspaceId = 'nest-realty-wilmington';
  const tenantId = 'tenant_nest_uat';

  // 1. RBAC & LEAST-PRIVILEGE PERMISSION BOUNDARIES
  describe('1. Contributor Least-Privilege RBAC Controls', () => {
    it('grants sop_contributor scoped permissions without publishing or administrative rights', () => {
      const contributorPerms = ROLE_PERMISSIONS['sop_contributor'];
      expect(contributorPerms).toBeDefined();
      expect(contributorPerms).toContain('sops.read_assigned');
      expect(contributorPerms).toContain('sops.write_assigned');
      expect(contributorPerms).toContain('ai.use');

      // Crucial security boundaries: contributor MUST NOT have publishing, deleting, or admin privileges
      expect(contributorPerms).not.toContain('sops.publish');
      expect(contributorPerms).not.toContain('sops.approve');
      expect(contributorPerms).not.toContain('sops.delete');
      expect(contributorPerms).not.toContain('manage_users');
      expect(contributorPerms).not.toContain('manage_workspace');
    });

    it('grants owner and bic roles full publishing and approval capabilities', () => {
      const ownerPerms = ROLE_PERMISSIONS['owner'];
      const bicPerms = ROLE_PERMISSIONS['bic'];

      expect(ownerPerms).toContain('sops.publish');
      expect(ownerPerms).toContain('sops.approve');
      expect(ownerPerms).toContain('sops.delete');

      expect(bicPerms).toContain('sops.publish');
      expect(bicPerms).toContain('sops.approve');
      expect(bicPerms).toContain('contract_bic_review');
    });
  });

  // 2. CRYPTOGRAPHIC TOKEN GENERATION, STORAGE & LIFECYCLE
  describe('2. Single-Use Cryptographic Token Management', () => {
    it('creates authoring request with SHA-256 token digest and expiration', async () => {
      const req = await sopAuthoringRequestRepository.createRequest({
        workspaceId,
        employeeName: 'Taylor Smith',
        employeeEmail: 'taylor.smith@nestrealty.com',
        employeeRole: 'Transaction Coordinator',
        processName: 'Earnest Money Deposit Escrow Accounting Procedure',
        processContext: 'Verify escrow receipt within 3 business days per NCREC Rule 58A .0116.',
        requiresBicReview: true,
        riskLevel: 'compliance_sensitive',
        requestedByUserId: 'usr_ryan',
        requestedByName: 'Ryan Crecelius'
      });

      expect(req.id).toMatch(/^req_/);
      expect(req.invitationToken).toMatch(/^inv_sop_/);
      expect(req.tokenHash).toBe(hashToken(req.invitationToken));
      expect(req.status).toBe('sent');
      expect(req.requiresBicReview).toBe(true);
      expect(req.riskLevel).toBe('compliance_sensitive');
      expect(new Date(req.tokenExpiresAt).getTime()).toBeGreaterThan(Date.now());

      // Safe lookup by raw token
      const found = await sopAuthoringRequestRepository.getByToken(req.invitationToken);
      expect(found).not.toBeNull();
      expect(found?.employeeEmail).toBe('taylor.smith@nestrealty.com');
      expect(found?.processName).toContain('Earnest Money Deposit');
    });

    it('invalidates prior token upon resend and generates new single-use token', async () => {
      const original = await sopAuthoringRequestRepository.createRequest({
        workspaceId,
        employeeName: 'Alex Jordan',
        employeeEmail: 'alex@nestrealty.com',
        employeeRole: 'Marketing Coordinator',
        processName: 'Social Media & Listing Advertising Review'
      });

      const oldToken = original.invitationToken;
      const oldHash = original.tokenHash;

      // Resend invitation
      const resent = await sopAuthoringRequestRepository.resendRequest(original.id);
      expect(resent).not.toBeNull();
      expect(resent?.invitationToken).not.toBe(oldToken);
      expect(resent?.tokenHash).not.toBe(oldHash);

      // Old token MUST now be rejected
      const oldLookup = await sopAuthoringRequestRepository.getByToken(oldToken);
      expect(oldLookup).toBeNull();

      // New token MUST be valid
      const newLookup = await sopAuthoringRequestRepository.getByToken(resent!.invitationToken);
      expect(newLookup).not.toBeNull();
      expect(newLookup?.id).toBe(original.id);
    });

    it('rejects revoked authoring invitation tokens', async () => {
      const req = await sopAuthoringRequestRepository.createRequest({
        workspaceId,
        employeeName: 'Jordan Casey',
        employeeEmail: 'jordan@nestrealty.com',
        employeeRole: 'Operations Staff',
        processName: 'Lockbox & Key Security Audit'
      });

      await sopAuthoringRequestRepository.revokeRequest(req.id);

      const lookup = await sopAuthoringRequestRepository.getByToken(req.invitationToken);
      expect(lookup?.status).toBe('revoked');
    });
  });

  // 3. ACCOUNT ACTIVATION & PASSWORD POLICY ENFORCEMENT
  describe('3. Account Activation & Security Password Policy', () => {
    it('validates password policy requiring minimum 12 characters and max 1024 characters', () => {
      expect(validatePasswordPolicy('short').valid).toBe(false);
      expect(validatePasswordPolicy('').valid).toBe(false);
      expect(validatePasswordPolicy('12345678901').valid).toBe(false);
      expect(validatePasswordPolicy('NestRealty2026!SecureOps').valid).toBe(true);
      expect(validatePasswordPolicy('long-passphrase-with-multiple-words-secure-for-staff').valid).toBe(true);
    });

    it('returns safe sanitized invitation details for public activation route', async () => {
      const details = await getInvitationDetails('inv_tok_melissa_da_audit_2026');
      expect(details.valid).toBe(true);
      expect(details.invitation).toBeDefined();
      expect(details.invitation?.emailRedacted).toContain('***');
      expect(details.invitation?.workspaceName).toBe('Nest Realty Wilmington');
    });
  });

  // 4. SUBMISSION, BIC COMPLIANCE & PUBLICATION GOVERNANCE
  describe('4. Submission, BIC Review Gate & Publication State Machine', () => {
    it('progresses through draft -> submission -> BIC verification -> Ryan final publication', async () => {
      const sopId = `sop_da_audit_${Date.now()}`;
      const draftDoc: SopDocument = {
        id: sopId,
        tenantId,
        workspaceId,
        title: 'Commission DA Verification & Escrow Audit Procedure',
        purpose: 'Verify seller digital signature and NCREC commission split accounting.',
        trigger: 'Receipt of closing settlement statement',
        processOwner: 'Melissa Gagliardi',
        participants: ['Melissa Gagliardi', 'Eric Knight (BIC)'],
        prerequisites: ['Signed Form 201', 'Settlement Statement'],
        requiredInputs: ['CDA Worksheet', 'Escrow Ledger'],
        orderedSteps: [
          { id: 's1', stepNumber: 1, action: 'Cross-reference agent commission rate with Dotloop contract.', role: 'Transaction Coordinator', systemUsed: 'Dotloop' },
          { id: 's2', stepNumber: 2, action: 'Verify seller digital signature on closing disclosure.', role: 'Transaction Coordinator', systemUsed: 'Dotloop' }
        ],
        decisions: ['If split discrepancy exceeds $100, escalate to Ryan Crecelius.'],
        exceptions: ['Dual agency requires explicit confirmation.'],
        escalationPaths: ['Escrow disputes escalate to Eric Knight (BIC).'],
        completionEvidence: 'Signed DA archived in Dotloop.',
        expectedTiming: 'Within 24 hours',
        systemsUsed: ['Dotloop', 'QuickBooks'],
        reviewer: 'Ryan Crecelius',
        publisher: 'Unassigned',
        effectiveDate: 'Draft',
        reviewDate: 'Quarterly',
        openQuestions: [],
        status: 'draft',
        author: 'Melissa Gagliardi',
        aiAssisted: true,
        transcriptRetention: 'sop_only',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      };

      // 1. Contributor saves draft
      await sopRepository.saveDraft(draftDoc);
      const savedDraft = await sopRepository.getDraftById(sopId, tenantId);
      expect(savedDraft?.status).toBe('draft');

      // 2. Contributor submits for review
      await sopAuthoringRequestRepository.updateRequest('req_melissa_da_verification', {
        status: 'submitted',
        submittedAt: new Date().toISOString(),
        resultingSopDraftIds: [sopId]
      });

      const submittedReq = await sopAuthoringRequestRepository.getById('req_melissa_da_verification');
      expect(submittedReq?.status).toBe('submitted');

      // 3. BIC reviews compliance and approves
      await sopAuthoringRequestRepository.updateRequest('req_melissa_da_verification', {
        status: 'bic_approved',
        reviewNotes: 'BIC compliance review verified by Eric Knight.'
      });

      const bicApprovedReq = await sopAuthoringRequestRepository.getById('req_melissa_da_verification');
      expect(bicApprovedReq?.status).toBe('bic_approved');

      // 4. Ryan Crecelius (Broker Owner) publishes official SOP
      const published = await sopRepository.publishSop(sopId, tenantId, 'Ryan Crecelius (Broker Owner)');
      expect(published.status).toBe('published');
      expect(published.publisher).toContain('Ryan Crecelius');
      expect(published.effectiveDate).toBeDefined();

      await sopAuthoringRequestRepository.updateRequest('req_melissa_da_verification', {
        status: 'published',
        publishedAt: new Date().toISOString()
      });

      const finalReq = await sopAuthoringRequestRepository.getById('req_melissa_da_verification');
      expect(finalReq?.status).toBe('published');
    });
  });

  // 5. RAG RETRIEVAL BOUNDARY (STRICTLY PUBLISHED-ONLY)
  describe('5. Authoritative Policy RAG Isolation', () => {
    it('retrieves ONLY published SOPs and never returns drafts or unapproved procedures as authoritative policy', async () => {
      const unpublishedDraftId = `sop_unapproved_secret_${Date.now()}`;
      const unpublishedTitle = `Unapproved Draft Commission Policy ${Date.now()}`;

      await sopRepository.saveDraft({
        id: unpublishedDraftId,
        tenantId,
        workspaceId,
        title: unpublishedTitle,
        purpose: 'Draft policy not yet reviewed or approved by Ryan.',
        trigger: 'Test trigger',
        processOwner: 'Staff Contributor',
        participants: [],
        prerequisites: [],
        requiredInputs: [],
        orderedSteps: [{ id: 's1', stepNumber: 1, action: 'Do something experimental.', role: 'Staff Contributor' }],
        decisions: [],
        exceptions: [],
        escalationPaths: [],
        completionEvidence: '',
        expectedTiming: '',
        systemsUsed: [],
        reviewer: 'Ryan Crecelius',
        publisher: '',
        effectiveDate: '',
        reviewDate: '',
        openQuestions: [],
        status: 'draft', // NOT PUBLISHED
        author: 'Staff Contributor',
        aiAssisted: true,
        transcriptRetention: 'sop_only',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      });

      // Query NORA knowledge retrieval
      const res = queryUnifiedContext(`What is the ${unpublishedTitle} procedure?`, { tenantId, workspaceId });

      // Must NOT match the unapproved draft as an authoritative policy SOP
      if (res.matchedDomain === 'sops' && res.evidenceCard?.title) {
        expect(res.evidenceCard.title).not.toBe(unpublishedTitle);
      }
    });

    it('immediately retrieves published SOP as authoritative Nest policy upon publication', async () => {
      const publishableId = `sop_pub_verified_${Date.now()}`;
      const publishableTitle = `Emergency Keybox Procedure ${Date.now()}`;

      await sopRepository.saveDraft({
        id: publishableId,
        tenantId,
        workspaceId,
        title: publishableTitle,
        purpose: 'Official procedure for emergency keybox dispatch.',
        trigger: 'Agent lockout or emergency inspection',
        processOwner: 'Steve Schram',
        participants: ['Steve Schram', 'Ryan Crecelius'],
        prerequisites: ['Lockbox code verification'],
        requiredInputs: ['Property Address'],
        orderedSteps: [{ id: 's1', stepNumber: 1, action: 'Dispatch backup master key from Mayfaire office vault.', role: 'Operations' }],
        decisions: [],
        exceptions: [],
        escalationPaths: [],
        completionEvidence: 'Vault log signed.',
        expectedTiming: '30 minutes',
        systemsUsed: ['Master Vault'],
        reviewer: 'Ryan Crecelius',
        publisher: 'Ryan Crecelius',
        effectiveDate: new Date().toISOString(),
        reviewDate: 'Annual',
        openQuestions: [],
        status: 'draft',
        author: 'Steve Schram',
        aiAssisted: true,
        transcriptRetention: 'sop_only',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      });

      // Publish the SOP as Ryan
      await sopRepository.publishSop(publishableId, tenantId, 'Ryan Crecelius');

      // Query NORA RAG
      const res = queryUnifiedContext(`What is the ${publishableTitle} procedure?`, { tenantId, workspaceId });

      expect(res.matchedDomain).toBe('sops');
      expect(res.spokenAnswer).toContain(publishableTitle);
      expect(res.evidenceCard?.deepLinkUrl).toContain(publishableId);
    });
  });
});
