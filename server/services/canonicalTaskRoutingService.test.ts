import fs from 'fs';
import path from 'path';
import { describe, it, expect, beforeEach } from 'vitest';
import { canonicalTaskRoutingService } from './canonicalTaskRoutingService.js';
import { updateStaffMemberProfile } from '../persistence/operationsDirectoryRepository.js';
import { orgChartRepository } from '../persistence/orgChartRepository.js';
import { sopRepository } from '../persistence/sopRepository.js';
import { registerSopCategoryCompatibility } from '../policies/sopCategoryCompatibility.js';

describe('Canonical Task Routing Service (Authority Engine)', () => {
  const wsWilmington = 'ws_wilmington';

  beforeEach(() => {
    // Reset staff out-of-office status to ensure clean test state
    updateStaffMemberProfile('dir_eduardo_lovo_73', { status: 'active', backupStaffId: undefined, backupStaffName: undefined });
    updateStaffMemberProfile('dir_ann_gunn_28', { status: 'active', backupStaffId: undefined, backupStaffName: undefined });
    updateStaffMemberProfile('dir_melissa_gagliardi_33', { status: 'active', backupStaffId: undefined, backupStaffName: undefined });
    updateStaffMemberProfile('dir_marcus_aman', { status: 'active', backupStaffId: undefined, backupStaffName: undefined });
    updateStaffMemberProfile('dir_ryan_crecelius_6', { status: 'active', backupStaffId: undefined, backupStaffName: undefined });
  });

  // =========================================================================
  // SCENARIO 1: Standard Marketing Deliverable
  // =========================================================================
  it('Scenario 1: Routes marketing flyer to Eduardo Lovo with Melissa Gagliardi as review owner under SOP-MKT-003', async () => {
    const decision = await canonicalTaskRoutingService.resolveRouting({
      workspaceId: wsWilmington,
      category: 'marketing_collateral',
      deliverableType: 'Double-Sided 8.5x11 Property Flyer',
      title: 'Flyer for 1104 Arboretum Dr',
      channel: 'web',
      requesterName: 'Matt Orr',
      propertyAddress: '1104 Arboretum Dr, Wilmington, NC 28405',
      classificationConfidence: 0.95
    });

    expect(decision.routingState).toBe('resolved');
    expect(decision.departmentId).toBe('Marketing request');
    expect(decision.assigneeStaffId).toBe('dir_eduardo_lovo_73');
    expect(decision.assigneeName).toBe('Eduardo Lovo');
    expect(decision.reviewOwnerStaffId).toBe('dir_melissa_gagliardi_33');
    expect(decision.reviewOwnerName).toBe('Melissa Gagliardi');
    expect(decision.governingSopId).toBe('sop_marketing_intake_003');
    expect(decision.snapshot).toBeDefined();
    expect(decision.reasonCodes).toContain('CANONICAL_RULE_MATCH');
  });

  // =========================================================================
  // SCENARIO 2: Signage & Yard Post Installation
  // =========================================================================
  it('Scenario 2: Routes yard sign post installation to Ann Gunn with BIC Ryan Crecelius as review owner under SOP-OPS-001', async () => {
    const decision = await canonicalTaskRoutingService.resolveRouting({
      workspaceId: wsWilmington,
      category: 'signage',
      deliverableType: 'Yard Sign Post Installation',
      title: 'Yard sign post with rider',
      channel: 'phone',
      requesterName: 'Ryan Crecelius',
      propertyAddress: '742 Lumina Ave, Wrightsville Beach, NC 28480',
      classificationConfidence: 0.95
    });

    expect(decision.routingState).toBe('resolved');
    expect(decision.departmentId).toBe('Signs / riders');
    expect(decision.assigneeStaffId).toBe('dir_ann_gunn_28');
    expect(decision.assigneeName).toBe('Ann Gunn');
    expect(decision.reviewOwnerStaffId).toBe('dir_ryan_crecelius_6');
    expect(decision.reviewOwnerName).toBe('Ryan Crecelius');
    expect(decision.governingSopId).toBe('sop_sign_vendor_004');
  });

  // =========================================================================
  // SCENARIO 3: Technology, Systems & IT (No approved SOP -> Honest Triage)
  // =========================================================================
  it('Scenario 3: Routes technology/IT request to triage honestly when no approved SOP exists', async () => {
    const decision = await canonicalTaskRoutingService.resolveRouting({
      workspaceId: wsWilmington,
      category: 'technology',
      deliverableType: 'WiFi and Laptop Configuration',
      title: 'Printer and WiFi connectivity issue in conference room',
      channel: 'manual',
      requesterName: 'Julie Brown',
      classificationConfidence: 0.95
    });

    expect(decision.routingState).toBe('triage_required');
    expect(decision.reasonCodes).toContain('NO_APPROVED_SOP_FOR_CATEGORY');
    expect(decision.triageReason).toContain('No approved Standard Operating Procedure exists for Technology');
    expect(decision.assigneeStaffId).toBeUndefined();
  });

  // =========================================================================
  // SCENARIO 4: Technology request after local tech policy is published
  // =========================================================================
  it('Scenario 4: Resolves technology request to Marcus Aman when valid tech SOP & policy rule are published', async () => {
    // 1. Create and publish a local tech SOP in sopRepository
    await sopRepository.saveDraft({
      id: 'sop_it_systems_support_local_001',
      title: 'IT Systems, Hardware & Network Support Protocol',
      purpose: 'Standard operating procedure for brokerage workstation, network, and printer troubleshooting',
      version: 1,
      status: 'published',
      workspaceId: wsWilmington,
      tenantId: 'tenant_nest_uat',
      orderedSteps: [{ id: 'st_1', stepNumber: 1, action: 'Diagnose network.', role: 'IT Support' }]
    } as any);

    // 2. Register compatibility for this SOP
    registerSopCategoryCompatibility('sop_it_systems_support_local_001', {
      title: 'IT Systems, Hardware & Network Support Protocol',
      allowedCategories: ['it / systems', 'it_systems', 'technology', 'tech'],
      primaryDepartment: 'IT / systems'
    });

    // 3. Temporarily update the published policy rule in repository/DB to include this SOP
    const currentPolicy = await orgChartRepository.getPublishedPolicy(wsWilmington);
    expect(currentPolicy).toBeDefined();
    const itRule = currentPolicy!.rules.find(r => ['it / systems', 'technology', 'it_systems', 'tech'].includes(r.category.toLowerCase()));
    expect(itRule).toBeDefined();
    const originalSop = itRule!.governing_sop_id;
    itRule!.governing_sop_id = 'sop_it_systems_support_local_001';

    const { dbPool } = await import('../persistence/repositories.js');
    if (dbPool) {
      await dbPool.query(
        "UPDATE published_routing_rules SET governing_sop_id = $1 WHERE policy_id = $2 AND (category ILIKE '%it%' OR category ILIKE '%tech%')",
        ['sop_it_systems_support_local_001', currentPolicy!.policy.id]
      );
    }

    // Also update disk fallback file
    const pubPath = path.join(process.cwd(), 'backups', `published_policy_${wsWilmington}.json`);
    let originalFileRaw: string | undefined;
    if (fs.existsSync(pubPath)) {
      originalFileRaw = fs.readFileSync(pubPath, 'utf-8');
      const fileData = JSON.parse(originalFileRaw);
      const r = fileData.rules?.find((rl: any) => ['it / systems', 'technology', 'it_systems', 'tech'].includes(rl.category.toLowerCase()));
      if (r) {
        r.governing_sop_id = 'sop_it_systems_support_local_001';
        fs.writeFileSync(pubPath, JSON.stringify(fileData, null, 2), 'utf-8');
      }
    }

    try {
      const decision = await canonicalTaskRoutingService.resolveRouting({
        workspaceId: wsWilmington,
        category: 'technology',
        deliverableType: 'WiFi and Laptop Configuration',
        title: 'Printer and WiFi connectivity issue in conference room',
        channel: 'manual',
        requesterName: 'Julie Brown',
        classificationConfidence: 0.95
      });

      expect(decision.routingState).toBe('resolved');
      expect(decision.departmentId).toBe('IT / systems');
      expect(decision.assigneeStaffId).toBe('dir_marcus_aman');
      expect(decision.assigneeName).toBe('Marcus Aman');
      expect(decision.reviewOwnerStaffId).toBe('dir_ryan_crecelius_6');
      expect(decision.governingSopId).toBe('sop_it_systems_support_local_001');
    } finally {
      // Revert rule to preserve unconfigured tech state
      itRule!.governing_sop_id = originalSop;
      if (dbPool) {
        await dbPool.query(
          "UPDATE published_routing_rules SET governing_sop_id = $1 WHERE policy_id = $2 AND (category ILIKE '%it%' OR category ILIKE '%tech%')",
          [originalSop || null, currentPolicy!.policy.id]
        );
      }
      if (originalFileRaw && fs.existsSync(pubPath)) {
        fs.writeFileSync(pubPath, originalFileRaw, 'utf-8');
      }
    }
  });

  // =========================================================================
  // SCENARIO 4: Ambiguous Request / Low Confidence / Missing Address
  // =========================================================================
  it('Scenario 4a: Sends low classification confidence (< 0.7) to Triage with missing facts', async () => {
    const decision = await canonicalTaskRoutingService.resolveRouting({
      workspaceId: wsWilmington,
      title: 'Need some quick help with something',
      channel: 'phone',
      classificationConfidence: 0.5
    });

    expect(decision.routingState).toBe('triage_required');
    expect(decision.assigneeStaffId).toBeUndefined();
    expect(decision.assigneeName).toBeUndefined();
    expect(decision.reasonCodes).toContain('LOW_CLASSIFICATION_CONFIDENCE');
    expect(decision.missingFacts).toContain('classification_confidence');
    expect(decision.triageReason).toBeDefined();
  });

  it('Scenario 4b: Sends marketing request without property address to Triage', async () => {
    const decision = await canonicalTaskRoutingService.resolveRouting({
      workspaceId: wsWilmington,
      category: 'marketing_collateral',
      deliverableType: 'Flyer',
      title: 'Listing brochure without address',
      propertyAddress: '', // Missing address
      channel: 'web',
      classificationConfidence: 0.95
    });

    expect(decision.routingState).toBe('triage_required');
    expect(decision.missingFacts).toContain('property_address');
    expect(decision.reasonCodes).toContain('PROPERTY_ADDRESS_REQUIRED');
  });

  // =========================================================================
  // SCENARIO 5: Out-of-Office Coverage Engine
  // =========================================================================
  it('Scenario 5: Automatically delegates to active backup when primary assignee is Out-of-Office', async () => {
    // Put Eduardo Lovo on OOO with Melissa Gagliardi as backup
    updateStaffMemberProfile('dir_eduardo_lovo_73', {
      status: 'out_of_office',
      backupStaffId: 'dir_melissa_gagliardi_33',
      backupStaffName: 'Melissa Gagliardi'
    });

    const decision = await canonicalTaskRoutingService.resolveRouting({
      workspaceId: wsWilmington,
      category: 'marketing_collateral',
      deliverableType: 'Double-Sided 8.5x11 Property Flyer',
      title: 'Flyer for 408 Landfall Dr',
      channel: 'web',
      propertyAddress: '408 Landfall Dr, Wilmington, NC 28405',
      classificationConfidence: 0.95
    });

    expect(decision.routingState).toBe('resolved');
    expect(decision.coveringStaffId).toBe('dir_melissa_gagliardi_33');
    expect(decision.coveringStaffName).toBe('Melissa Gagliardi');
    expect(decision.originalStaffId).toBe('dir_eduardo_lovo_73');
    expect(decision.originalStaffName).toBe('Eduardo Lovo');
    expect(decision.assigneeStaffId).toBe('dir_melissa_gagliardi_33');
    expect(decision.assigneeName).toBe('Melissa Gagliardi');
    expect(decision.reasonCodes).toContain('STAFF_OUT_OF_OFFICE_COVERAGE_APPLIED');
  });

  it('Scenario 5b: Breaks OOO delegation loop safely if staff members cross-reference each other', async () => {
    // Eduardo -> Melissa -> Eduardo (Cycle)
    updateStaffMemberProfile('dir_eduardo_lovo_73', {
      status: 'out_of_office',
      backupStaffId: 'dir_melissa_gagliardi_33'
    });
    updateStaffMemberProfile('dir_melissa_gagliardi_33', {
      status: 'out_of_office',
      backupStaffId: 'dir_eduardo_lovo_73'
    });

    const decision = await canonicalTaskRoutingService.resolveRouting({
      workspaceId: wsWilmington,
      category: 'marketing_collateral',
      deliverableType: 'Flyer',
      title: 'Flyer for 126 Parkwood',
      propertyAddress: '126 Parkwood Ave, Wilmington NC',
      channel: 'web',
      classificationConfidence: 0.95
    });

    // Should detect cycle and route to triage rather than infinite recursion
    expect(decision.routingState).toBe('triage_required');
    expect(decision.reasonCodes).toContain('OOO_COVERAGE_CYCLE_OR_UNAVAILABLE');
  });

  it('Scenario 5c: Prevents self-approval collapse when reviewing manager OOO delegates to task producer', async () => {
    // Melissa (Review Owner) goes OOO and designates Eduardo (Task Producer) as backup
    updateStaffMemberProfile('dir_melissa_gagliardi_33', {
      status: 'out_of_office',
      backupStaffId: 'dir_eduardo_lovo_73',
      backupStaffName: 'Eduardo Lovo'
    });

    const decision = await canonicalTaskRoutingService.resolveRouting({
      workspaceId: wsWilmington,
      category: 'marketing_collateral',
      deliverableType: 'Double-Sided 8.5x11 Property Flyer',
      title: 'Flyer for 100 Wrightsville Ave',
      propertyAddress: '100 Wrightsville Ave, Wilmington NC',
      channel: 'web',
      classificationConfidence: 0.95
    });

    // Producer must remain Eduardo Lovo
    expect(decision.assigneeStaffId).toBe('dir_eduardo_lovo_73');
    // Review owner must NEVER collapse to Eduardo Lovo (self-approval forbidden)
    expect(decision.reviewOwnerStaffId).not.toBe('dir_eduardo_lovo_73');
    // Must escalate review to BIC Ryan Crecelius
    expect(decision.reviewOwnerStaffId).toBe('dir_ryan_crecelius_6');
    expect(decision.reasonCodes).toContain('SELF_APPROVAL_PREVENTED');
    expect(decision.reasonCodes).toContain('ESCALATED_TO_BROKER_IN_CHARGE_FOR_REVIEW');
  });

  it('Scenario 5d: Routes to triage if all escalation paths collapse into self-approval', async () => {
    // Melissa OOO -> Eduardo
    updateStaffMemberProfile('dir_melissa_gagliardi_33', {
      status: 'out_of_office',
      backupStaffId: 'dir_eduardo_lovo_73',
      backupStaffName: 'Eduardo Lovo'
    });
    // Ryan Crecelius (BIC) is ALSO OOO
    updateStaffMemberProfile('dir_ryan_crecelius_6', {
      status: 'out_of_office',
      backupStaffId: 'dir_eduardo_lovo_73'
    });

    const decision = await canonicalTaskRoutingService.resolveRouting({
      workspaceId: wsWilmington,
      category: 'marketing_collateral',
      deliverableType: 'Double-Sided 8.5x11 Property Flyer',
      title: 'Flyer for 100 Wrightsville Ave',
      propertyAddress: '100 Wrightsville Ave, Wilmington NC',
      channel: 'web',
      classificationConfidence: 0.95
    });

    // When no non-conflicting reviewer is available, must fail safe to triage
    expect(decision.routingState).toBe('triage_required');
    expect(decision.reasonCodes).toContain('SELF_APPROVAL_PREVENTED');
    expect(decision.reasonCodes).toContain('ROLE_BOUNDARY_COLLAPSE_DETECTED');
  });

  // =========================================================================
  // SCENARIO 6: Invalid Policy Configuration / Non-Existent Workspace
  // =========================================================================
  it('Scenario 6: Gracefully fails to configuration_error when workspace has no policy and fallback is unseeded', async () => {
    const decision = await canonicalTaskRoutingService.resolveRouting({
      workspaceId: 'ws_completely_unknown_empty_99',
      title: 'Some task in unknown space',
      channel: 'web',
      classificationConfidence: 0.9
    });

    expect(['configuration_error', 'triage_required']).toContain(decision.routingState);
    expect(decision.confidence).toBeLessThanOrEqual(0.5);
  });

  // =========================================================================
  // SCENARIO 7: Cross-Workspace Assignment Rejection
  // =========================================================================
  it('Scenario 7: Rejects client proposed assignee from a different workspace', async () => {
    const decision = await canonicalTaskRoutingService.resolveRouting({
      workspaceId: wsWilmington,
      category: 'marketing_collateral',
      deliverableType: 'Flyer',
      title: 'Cross workspace security test',
      propertyAddress: '100 Main St, Wilmington NC',
      channel: 'web',
      classificationConfidence: 0.95,
      // Attempting to inject a staff member from Charlottesville workspace
      clientProposedAssignee: 'staff_charlottesville_rogue_99'
    });

    expect(decision.reasonCodes).toContain('SECURITY_CROSS_WORKSPACE_OR_INVALID_STAFF_CLAIM_REJECTED');
    // Client injection must not overwrite authoritative assignment
    expect(decision.assigneeStaffId).not.toBe('staff_charlottesville_rogue_99');
  });

  // =========================================================================
  // PUBLISHED POLICY EVOLUTION
  // =========================================================================
  it('8. Supports publishing new policy versions and routing against incremented policy versions', async () => {
    const current = await orgChartRepository.getPublishedPolicy(wsWilmington);
    expect(current).toBeDefined();
    const prevVersion = current?.policy?.version || 1;

    // Publish new policy version
    const published = await orgChartRepository.publishOrgChartRoutingPolicy(
      wsWilmington,
      'Ryan Crecelius (Owner / BIC)',
      'usr_ryan_owner'
    );

    expect(published.policy.version).toBe(prevVersion + 1);

    // Resolve routing against the new rule
    const decision = await canonicalTaskRoutingService.resolveRouting({
      workspaceId: wsWilmington,
      category: 'marketing_collateral',
      deliverableType: 'Double-Sided 8.5x11 Property Flyer',
      title: 'Post-publish flyer',
      propertyAddress: '512 Oleander Dr, Wilmington NC',
      channel: 'web',
      classificationConfidence: 0.95
    });

    expect(decision.routingState).toBe('resolved');
    expect(decision.assigneeStaffId).toBe('dir_eduardo_lovo_73');
    expect(decision.ruleVersion).toBeGreaterThanOrEqual(published.policy.version);
  });
});
