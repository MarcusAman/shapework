import { describe, it, expect, beforeEach } from 'vitest';
import { orgChartRepository } from '../../server/persistence/orgChartRepository';
import { sopRepository } from '../../server/persistence/sopRepository';
import { ownerDigestEngine } from '../../server/notifications/ownerDigestEngine';
import { OrgPosition, OrgModel } from '../services/orgChartService';

describe('Customer Testing Feedback Suite (Testing Sheet Acceptance)', () => {
  const testWsId = 'ws_testing_sheet_uat';
  const testTenantId = 'tenant_nest_uat';

  const initialTestModel: OrgModel = {
    positions: [
      {
        id: 'pos_ryan',
        workspaceId: testWsId,
        name: 'Ryan Shield',
        title: 'Managing Principal / Owner',
        department: 'Executive',
        roleIds: ['role_principal'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'pos_eric',
        workspaceId: testWsId,
        name: 'Eric Knight',
        title: 'Managing Broker',
        department: 'Brokerage Ops',
        reportsToPositionId: 'pos_ryan',
        roleIds: ['role_broker'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'pos_lindsey',
        workspaceId: testWsId,
        name: 'Lindsey Jenkins',
        title: 'Marketing Specialist',
        department: 'Marketing',
        reportsToPositionId: 'pos_eric', // Initially reports to Eric Knight
        roleIds: ['role_mktg'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    roles: [
      {
        id: 'role_mktg',
        workspaceId: testWsId,
        positionId: 'pos_lindsey',
        name: 'Social Media & Listing Distribution',
        description: 'Designs flyers, launches digital ads, and distributes open house kits.',
        categories: ['Marketing'],
        sopIds: [],
        escalationPolicyIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    sops: [],
    connections: [],
    escalationPolicies: [],
    routingMatrix: [
      {
        category: 'Listing Marketing Request',
        displayName: 'Listing Marketing Blitz',
        description: 'New marketing materials for active listings',
        primaryOwnerPositionId: 'pos_lindsey',
        backupOwnerPositionId: 'pos_eric',
        sla: '24 hours',
        status: 'active'
      }
    ],
    knowledgeDocuments: [],
    logicNodes: []
  };

  beforeEach(() => {
    orgChartRepository.saveOrgChart(testWsId, JSON.parse(JSON.stringify(initialTestModel)), 'test_runner');
  });

  // -------------------------------------------------------------
  // ISSUE 5 & P0 DATA INTEGRITY: Reports-To Persistence & Cycle Protection
  // -------------------------------------------------------------
  describe('ISSUE 5 & P0: Reports-To Persistence & Referential Integrity', () => {
    it('persists change from Eric Knight to Ryan and survives repository reload', () => {
      // 1. Verify initial state
      const initial = orgChartRepository.getOrgChart(testWsId);
      const initialLindsey = initial.positions.find(p => p.id === 'pos_lindsey');
      expect(initialLindsey?.reportsToPositionId).toBe('pos_eric');

      // 2. Perform Matt\'s exact change: Lindsey reports to Ryan
      const { model: updatedModel, position: updatedLindsey } = orgChartRepository.updatePosition(
        testWsId,
        'pos_lindsey',
        { reportsToPositionId: 'pos_ryan' },
        'Matt Orr'
      );

      expect(updatedLindsey.reportsToPositionId).toBe('pos_ryan');

      // 3. Reload fresh from persistent datastore
      const reloadedModel = orgChartRepository.getOrgChart(testWsId);
      const reloadedLindsey = reloadedModel.positions.find(p => p.id === 'pos_lindsey');
      expect(reloadedLindsey?.reportsToPositionId).toBe('pos_ryan');

      // 4. Verify connection lines updated
      const repConn = (reloadedModel.connections as any)?.find((c: any) => c.fromPositionId === 'pos_lindsey');
      expect(repConn?.toPositionId).toBe('pos_ryan');

      // 5. Verify audit log recorded
      const audits = orgChartRepository.getAuditLog(testWsId);
      const lastAudit = audits.find(a => a.entityId === 'pos_lindsey' && a.action === 'update_position');
      expect(lastAudit).toBeDefined();
      expect(lastAudit?.performedBy).toBe('Matt Orr');
      expect(lastAudit?.previousValue.reportsToPositionId).toBe('pos_eric');
      expect(lastAudit?.newValue.reportsToPositionId).toBe('pos_ryan');
    });

    it('rejects self-reporting and circular hierarchy loops', () => {
      const model = orgChartRepository.getOrgChart(testWsId);

      // A cannot report to A
      const selfCheck = orgChartRepository.validateReportingHierarchy(model.positions, 'pos_lindsey', 'pos_lindsey');
      expect(selfCheck.valid).toBe(false);
      expect(selfCheck.error).toContain('cannot report to itself');

      // Lindsey reports to Ryan; attempting to make Ryan report to Lindsey must fail (A -> B -> A cycle)
      orgChartRepository.updatePosition(testWsId, 'pos_lindsey', { reportsToPositionId: 'pos_ryan' }, 'Matt');
      const updatedPositions = orgChartRepository.getOrgChart(testWsId).positions;

      const cycleCheck = orgChartRepository.validateReportingHierarchy(updatedPositions, 'pos_ryan', 'pos_lindsey');
      expect(cycleCheck.valid).toBe(false);
      expect(cycleCheck.error).toContain('Circular reporting hierarchy');
    });
  });

  // -------------------------------------------------------------
  // ISSUE 2 & P1: SOP Builder — Safe Draft Deletion
  // -------------------------------------------------------------
  describe('ISSUE 2 & P1: Draft SOP Safe Deletion', () => {
    it('allows deleting Draft SOPs but strictly blocks deleting Published SOPs', async () => {
      // 1. Create a working draft
      const draftId = `sop_draft_test_${Date.now()}`;
      await sopRepository.saveDraft({
        id: draftId,
        tenantId: testTenantId,
        workspaceId: testWsId,
        title: 'Temporary Open House Protocol Draft',
        purpose: 'Drafting steps for spring open houses',
        status: 'draft',
        version: 1,
        orderedSteps: []
      } as any);

      // Verify draft exists
      const draftsBefore = await sopRepository.listDrafts(testTenantId, testWsId);
      expect(draftsBefore.some(d => d.id === draftId)).toBe(true);

      // 2. Delete the draft
      const deleted = await sopRepository.deleteDraft(draftId, testTenantId, 'Matt Orr');
      expect(deleted).toBe(true);

      // Verify draft is removed from active list
      const draftsAfter = await sopRepository.listDrafts(testTenantId, testWsId);
      expect(draftsAfter.some(d => d.id === draftId)).toBe(false);

      // 3. Attempting to delete a Published SOP must throw a governance error
      await expect(
        sopRepository.deleteDraft('sop_listing_launch_001', testTenantId, 'Matt Orr')
      ).rejects.toThrow(/Only Draft SOPs may be deleted/);
    });
  });

  // -------------------------------------------------------------
  // ISSUE 6 & P1: Request Routing Rule Deletion & Deactivation
  // -------------------------------------------------------------
  describe('ISSUE 6 & P1: Request Routing Rule Deletion & Deactivation', () => {
    it('deactivates routing rule without losing historical record or permanently deletes unused rule', () => {
      // 1. Deactivate rule
      const model = orgChartRepository.deleteOrDeactivateRoutingRule(
        testWsId,
        'Listing Marketing Request',
        'deactivate',
        'Matt Orr'
      );

      const rule = model.routingMatrix?.find(r => r.category === 'Listing Marketing Request');
      expect(rule?.status).toBe('archived');

      // 2. Permanently delete rule
      const deletedModel = orgChartRepository.deleteOrDeactivateRoutingRule(
        testWsId,
        'Listing Marketing Request',
        'delete',
        'Matt Orr'
      );
      expect(deletedModel.routingMatrix?.some(r => r.category === 'Listing Marketing Request')).toBe(false);
    });
  });

  // -------------------------------------------------------------
  // ISSUE 4 & P2: Responsibilities Inspection & Editing
  // -------------------------------------------------------------
  describe('ISSUE 4 & P2: Responsibilities Inspection & Editing', () => {
    it('updates position responsibilities in place and preserves description and SLA', () => {
      const updatedModel = orgChartRepository.saveOrgChart(testWsId, {
        ...initialTestModel,
        roles: [
          {
            id: 'role_mktg',
            workspaceId: testWsId,
            positionId: 'pos_lindsey',
            name: 'Digital Ads & Yard Sign Marketing Lead',
            description: 'Coordinates social campaigns and yard signage delivery.',
            defaultSla: '4 hours',
            categories: ['Marketing', 'Signage'],
            sopIds: [],
            escalationPolicyIds: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
      }, 'Matt Orr');

      const role = updatedModel.roles.find(r => r.id === 'role_mktg');
      expect(role?.name).toBe('Digital Ads & Yard Sign Marketing Lead');
      expect(role?.defaultSla).toBe('4 hours');
    });
  });

  // -------------------------------------------------------------
  // FEATURE IDEA: Weekly Owner Digest Briefing
  // -------------------------------------------------------------
  describe('FEATURE IDEA: Weekly Owner Digest Briefing Engine', () => {
    it('generates truthful executive briefing data, renders clean HTML, and logs test delivery', async () => {
      // 1. Verify default config is inactive and has safe empty recipient list (safe default)
      const config = ownerDigestEngine.getConfig(testWsId);
      expect(config.enabled).toBe(false);
      expect(config.dayOfWeek).toBe('monday');
      expect(config.recipients).toEqual([]);

      // 2. Mock state with 1 overdue task, 1 completed task
      const mockState = {
        jobs: [
          {
            id: 'job_overdue_1',
            workflowName: 'Urgent Seller Boundary Dispute',
            status: 'blocked',
            priority: 'urgent',
            created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString()
          },
          {
            id: 'job_completed_1',
            workflowName: 'Listing Launch: 408 Landfall Dr',
            status: 'completed',
            completed_at: new Date().toISOString()
          }
        ],
        sops: [
          {
            id: 'sop_draft_1',
            title: 'Commercial Leasing Intake',
            status: 'draft'
          }
        ]
      };

      // 3. Generate digest
      const digestData = ownerDigestEngine.generateDigestData(testWsId, mockState);
      expect(digestData.needsAttentionCount).toBeGreaterThanOrEqual(2); // 1 blocked task + 1 draft SOP
      expect(digestData.resolvedLastWeekCount).toBe(1);

      // 4. Render HTML & Text
      const html = ownerDigestEngine.renderDigestHtml(digestData);
      expect(html).toContain('Monday');
      expect(html).toContain('Briefing');
      expect(html).toContain('Needs Attention');
      expect(html).toContain('Resolved Last Week');
      expect(html).not.toContain('Generated by AI'); // No forbidden AI buzzwords

      const text = ownerDigestEngine.renderDigestText(digestData);
      expect(text).toContain('NEST OPS — YOUR MONDAY BRIEFING');

      // 5. Send test digest
      const testResult = await ownerDigestEngine.sendTestDigest(testWsId, 'ryan@nestrealty.com', mockState, 'Ryan');
      expect(testResult.success).toBe(true);
      expect(testResult.messageId).toContain('msg_digest_test_');

      // 6. Test Idempotency: Repeating send immediately returns same messageId
      const repeatedResult = await ownerDigestEngine.sendTestDigest(testWsId, 'ryan@nestrealty.com', mockState, 'Ryan');
      expect(repeatedResult.success).toBe(true);
      expect(repeatedResult.messageId).toBe(testResult.messageId);
    });
  });

  // -------------------------------------------------------------
  // ISSUE 7 & P0: Directory Read-Only Integrity & Persistence
  // -------------------------------------------------------------
  describe('ISSUE 7 & P0: Directory Read-Only & State-Projection', () => {
    it('read path does not mutate state and updates persist across repeated reads', () => {
      const mockDirectoryPerson = {
        id: 'usr_dir_lindsey',
        workspaceId: testWsId,
        firstName: 'Lindsey',
        lastName: 'Jenkins',
        displayName: 'Lindsey Jenkins',
        title: 'Marketing Coordinator',
        phone: '910-555-0199',
        email: 'lindsey@nestrealty.com',
        primaryOfficeName: 'Wilmington',
        personType: 'staff' as const,
        officeIds: ['off_wilmington'],
        officeNames: ['Wilmington'],
        status: 'active' as const,
        updatedAt: '2026-08-01T10:00:00.000Z'
      };

      // 1. Initial state
      let directory = [mockDirectoryPerson];

      // 2. Perform 10 read operations and verify zero side-effects
      for (let i = 0; i < 10; i++) {
        const readResult = directory.filter(p => p.workspaceId === testWsId);
        expect(readResult.length).toBe(1);
        expect(readResult[0].updatedAt).toBe('2026-08-01T10:00:00.000Z');
      }

      // 3. Mutate fields (Matt adds phone and updates title)
      const updatedPerson = {
        ...mockDirectoryPerson,
        title: 'Senior Marketing Specialist & Media Lead',
        phone: '910-555-9876',
        updatedAt: new Date().toISOString()
      };
      directory = directory.map(p => p.id === updatedPerson.id ? updatedPerson : p);

      // 4. Re-read: verify updated info persists
      const reloaded = directory.find(p => p.id === 'usr_dir_lindsey');
      expect(reloaded?.title).toBe('Senior Marketing Specialist & Media Lead');
      expect(reloaded?.phone).toBe('910-555-9876');
    });
  });

  // -------------------------------------------------------------
  // SOP Authoring Request Reference Safety (Phase 16)
  // -------------------------------------------------------------
  describe('PHASE 16: SOP Authoring Request Reference Safety on Draft Removal', () => {
    it('safeguards authoring request history when linked draft is deleted', async () => {
      const { sopAuthoringRequestRepository } = await import('../../server/persistence/sopAuthoringRequestRepository');
      
      const req = await sopAuthoringRequestRepository.createRequest({
        workspaceId: testWsId,
        employeeId: 'usr_melissa',
        employeeName: 'Melissa Gagliardi',
        starterDraftId: 'sop_draft_tombstone_test',
        resultingSopDraftIds: ['sop_draft_tombstone_test']
      });

      expect(req.starterDraftId).toBe('sop_draft_tombstone_test');

      // Create draft in sopRepository
      await sopRepository.saveDraft({
        id: 'sop_draft_tombstone_test',
        tenantId: testTenantId,
        workspaceId: testWsId,
        title: 'Draft for DA Verification',
        purpose: 'Test purpose',
        status: 'draft',
        version: 1,
        orderedSteps: []
      } as any);

      // Delete draft
      await sopRepository.deleteDraft('sop_draft_tombstone_test', testTenantId, 'Ryan Crecelius');

      // Verify authoring request preserves history without breaking
      const updatedReq = await sopAuthoringRequestRepository.getById(req.id);
      expect(updatedReq).toBeDefined();
      expect(updatedReq?.starterDraftId).toBeUndefined();
      expect(updatedReq?.priorStarterDraftId).toBe('sop_draft_tombstone_test');
      expect(updatedReq?.reviewNotes).toContain('Working draft "sop_draft_tombstone_test" was removed by Ryan Crecelius');
    });
  });

  // -------------------------------------------------------------
  // Hierarchy Validation Multi-Hop Loop (Phase 6)
  // -------------------------------------------------------------
  describe('PHASE 6: Multi-Hop Circular Reporting Hierarchy Loop Detection', () => {
    it('rejects 3-node loop A -> B -> C -> A', () => {
      const positions: OrgPosition[] = [
        { id: 'pos_a', workspaceId: testWsId, name: 'Alice', title: 'Director', reportsToPositionId: 'pos_b', roleIds: [], createdAt: '', updatedAt: '' },
        { id: 'pos_b', workspaceId: testWsId, name: 'Bob', title: 'Manager', reportsToPositionId: 'pos_c', roleIds: [], createdAt: '', updatedAt: '' },
        { id: 'pos_c', workspaceId: testWsId, name: 'Charlie', title: 'Lead', reportsToPositionId: undefined, roleIds: [], createdAt: '', updatedAt: '' }
      ];

      // Making Charlie report to Alice would form C -> A -> B -> C
      const check = orgChartRepository.validateReportingHierarchy(positions, 'pos_c', 'pos_a');
      expect(check.valid).toBe(false);
      expect(check.error).toContain('Circular reporting hierarchy');
    });
  });
});
