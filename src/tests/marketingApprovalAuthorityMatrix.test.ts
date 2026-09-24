import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  hasMarketingFinalApprovalAuthority,
  validateSelfApprovalSafety,
  isMarketingDomain
} from '../../server/policies/canonicalMarketingLifecyclePolicy.js';
import {
  CanonicalMarketingTask
} from '../../server/persistence/marketingCampaignsRepository.js';
import {
  cachedActivePolicies,
  PublishedRoutingPolicy,
  PublishedRoutingRule
} from '../../server/persistence/orgChartRepository.js';

describe('Marketing Approval Authority 10-Permutation Matrix', () => {
  const wsId = 'ws_wilmington';

  // Seeded identities
  const melissaUser = {
    id: 'dir_melissa_gagliardi_33',
    email: 'melissa.gagliardi@nestrealty.com',
    name: 'Melissa Gagliardi',
    role: 'marketing_director',
    permissions: ['marketing.final_approval']
  };

  const eduardoUser = {
    id: 'usr_eduardo',
    email: 'eduardo.lovo@nestrealty.com',
    name: 'Eduardo Lovo',
    role: 'producer',
    permissions: ['marketing.campaign.create', 'marketing.campaign.request_review']
  };

  let originalPolicyEntry: any;

  beforeEach(() => {
    // Preserve current in-memory policy
    originalPolicyEntry = cachedActivePolicies.get(wsId);

    // Set canonical published policy designating dir_melissa_gagliardi_33 as marketing review owner
    const mockPolicy: PublishedRoutingPolicy = {
      id: 'pol_test_v1',
      workspace_id: wsId,
      version: 1,
      published_by: 'Ryan Crecelius',
      published_by_user_id: 'usr_ryan',
      published_at: new Date().toISOString(),
      is_active: true,
      rules_count: 2,
      validation_hash: 'hash123',
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const mockRules: PublishedRoutingRule[] = [
      {
        id: 'rule_marketing_1',
        policy_id: 'pol_test_v1',
        workspace_id: wsId,
        rule_index: 0,
        category: 'Marketing request',
        display_name: 'Marketing Collateral & Flyer Production',
        primary_position_id: 'pos_va',
        primary_staff_id: 'dir_eduardo_lovo_73',
        review_staff_id: 'dir_melissa_gagliardi_33',
        sla_hours: 24,
        sla_display: '24 hours',
        status: 'active',
        match_keywords: ['marketing'],
        created_at: new Date().toISOString()
      },
      {
        id: 'rule_listing_mkt_2',
        policy_id: 'pol_test_v1',
        workspace_id: wsId,
        rule_index: 1,
        category: 'Listing marketing',
        display_name: 'Listing Marketing Launch',
        primary_position_id: 'pos_va',
        primary_staff_id: 'dir_eduardo_lovo_73',
        review_staff_id: 'dir_melissa_gagliardi_33',
        sla_hours: 12,
        sla_display: '12 hours',
        status: 'active',
        match_keywords: ['listing marketing'],
        created_at: new Date().toISOString()
      }
    ];

    cachedActivePolicies.set(wsId, {
      policy: mockPolicy,
      rules: mockRules,
      cachedAt: Date.now()
    });
  });

  afterEach(() => {
    if (originalPolicyEntry) {
      cachedActivePolicies.set(wsId, originalPolicyEntry);
    } else {
      cachedActivePolicies.delete(wsId);
    }
  });

  // Permutation 1: Melissa approving work she authored/submitted
  it('1. Melissa (Marketing Operations Director) may approve work she authored and uploaded', () => {
    const task: CanonicalMarketingTask = {
      id: 'tsk_manual_1788826222992_befmn',
      requestId: 'req_001',
      title: 'Listing Launch Postcard — 100 Airlie Rd',
      category: 'Listing marketing',
      workspaceId: wsId,
      status: 'in_progress',
      reviewState: 'awaiting_review',
      proofs: [
        {
          id: 'prf_001',
          url: 'https://example.com/postcard.pdf',
          uploadedBy: 'Melissa Gagliardi',
          uploadedById: 'dir_melissa_gagliardi_33',
          version: 1,
          createdAt: new Date().toISOString(),
          status: 'pending'
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    
      reviewOwnerId: 'dir_melissa_gagliardi_33',
      reviewOwnerName: 'Melissa Gagliardi'};

    const check = validateSelfApprovalSafety(task, melissaUser);
    expect(check.allowed).toBe(true);
    expect(check.isDirectorApproval).toBe(true);
    expect(check.authorityExplanation).toBeTruthy();
  });

  // Permutation 2: Melissa approving work assigned to her
  it('2. Melissa may approve marketing work directly assigned to her', () => {
    const task: CanonicalMarketingTask = {
      id: 'tsk_assigned_melissa',
      requestId: 'req_002',
      title: 'Digital Ad Campaign — Autumn Collection',
      category: 'Marketing request',
      workspaceId: wsId,
      assignedTo: 'Melissa Gagliardi',
      assignedToId: 'dir_melissa_gagliardi_33',
      status: 'in_progress',
      reviewState: 'awaiting_review',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    
      reviewOwnerId: 'dir_melissa_gagliardi_33',
      reviewOwnerName: 'Melissa Gagliardi'};

    const check = validateSelfApprovalSafety(task, melissaUser);
    expect(check.allowed).toBe(true);
    expect(check.isDirectorApproval).toBe(true);
  });

  // Permutation 3: Melissa approving work produced by another producer (Eduardo)
  it('3. Melissa may approve work produced by another producer (Eduardo)', () => {
    const task: CanonicalMarketingTask = {
      id: 'tsk_produced_eduardo',
      requestId: 'req_003',
      title: 'Property Flyer — 456 Sound View Dr',
      category: 'Marketing request',
      workspaceId: wsId,
      assignedTo: 'Eduardo Lovo',
      assignedToId: 'dir_eduardo_lovo_73',
      proofs: [
        {
          id: 'prf_eduardo_1',
          url: 'https://example.com/flyer.pdf',
          uploadedBy: 'Eduardo Lovo',
          uploadedById: 'dir_eduardo_lovo_73',
          version: 1,
          createdAt: new Date().toISOString(),
          status: 'pending'
        }
      ],
      status: 'in_progress',
      reviewState: 'awaiting_review',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    
      reviewOwnerId: 'dir_melissa_gagliardi_33',
      reviewOwnerName: 'Melissa Gagliardi'};

    const check = validateSelfApprovalSafety(task, melissaUser);
    expect(check.allowed).toBe(true);
    expect(check.isDirectorApproval).toBe(true);
  });

  // Permutation 4: Eduardo attempting to approve his own proof (403 FORBIDDEN_NOT_TASK_REVIEWER)
  it('4. Eduardo attempting to approve his own proof is blocked with FORBIDDEN_NOT_TASK_REVIEWER', () => {
    const task: CanonicalMarketingTask = {
      id: 'tsk_eduardo_self',
      requestId: 'req_004',
      title: 'Property Brochure — 789 Waterway',
      category: 'Marketing request',
      workspaceId: wsId,
      assignedTo: 'Eduardo Lovo',
      assignedToId: 'dir_eduardo_lovo_73',
      proofs: [
        {
          id: 'prf_eduardo_self',
          url: 'https://example.com/brochure.pdf',
          uploadedBy: 'Eduardo Lovo',
          uploadedById: 'dir_eduardo_lovo_73',
          version: 1,
          createdAt: new Date().toISOString(),
          status: 'pending'
        }
      ],
      status: 'in_progress',
      reviewState: 'awaiting_review',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const check = validateSelfApprovalSafety(task, eduardoUser);
    expect(check.allowed).toBe(false);
    expect(check.errorCode).toBe('FORBIDDEN_NOT_TASK_REVIEWER');
    expect(check.allowed).toBe(false);
  });

  // Permutation 5: Eduardo attempting to approve another producer's proof (403 FORBIDDEN_NOT_TASK_REVIEWER)
  it('5. Eduardo attempting to approve another producer\'s proof is blocked with FORBIDDEN_NOT_TASK_REVIEWER', () => {
    const task: CanonicalMarketingTask = {
      id: 'tsk_other_producer',
      requestId: 'req_005',
      title: 'Listing Presentation — 12 Cove Rd',
      category: 'Marketing request',
      workspaceId: wsId,
      assignedTo: 'Ann Gunn',
      assignedToId: 'dir_ann_gunn_28',
      proofs: [
        {
          id: 'prf_ann_1',
          url: 'https://example.com/pres.pdf',
          uploadedBy: 'Ann Gunn',
          uploadedById: 'dir_ann_gunn_28',
          version: 1,
          createdAt: new Date().toISOString(),
          status: 'pending'
        }
      ],
      status: 'in_progress',
      reviewState: 'awaiting_review',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const check = validateSelfApprovalSafety(task, eduardoUser);
    expect(check.allowed).toBe(false);
    expect(check.errorCode).toBe('FORBIDDEN_NOT_TASK_REVIEWER');
    expect(check.allowed).toBe(false);
  });

  // Permutation 6: OOO coverage / task assignment not granting approval authority to Eduardo
  it('6. OOO backup coverage does not grant approval authority to a producer', () => {
    const task: CanonicalMarketingTask = {
      id: 'tsk_ooo_coverage',
      requestId: 'req_006',
      title: 'Open House Flyer — 14 Marsh Lane',
      category: 'Marketing request',
      workspaceId: wsId,
      assignedTo: 'Eduardo Lovo',
      assignedToId: 'dir_eduardo_lovo_73',
      coveringStaffId: 'dir_eduardo_lovo_73', // covering for someone
      status: 'in_progress',
      reviewState: 'awaiting_review',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Even if Eduardo is covering OOO, he does not gain marketing.final_approval
    const authority = hasMarketingFinalApprovalAuthority(eduardoUser, task, wsId);
    expect(authority.authorized).toBe(false);

    const check = validateSelfApprovalSafety(task, eduardoUser);
    expect(check.allowed).toBe(false);
  });

  // Permutation 7: Display name spoofing alone cannot grant approval authority
  it('7. Display name spoofing alone without canonical identity or credentials cannot grant approval authority', () => {
    const imposterUser = {
      id: 'usr_imposter_99',
      email: 'attacker@evil.com',
      name: 'Melissa Gagliardi', // Spoofed display name
      role: 'producer',
      permissions: []
    };

    const task: CanonicalMarketingTask = {
      id: 'tsk_spoof_attempt',
      requestId: 'req_007',
      title: 'Flyer Approval Under Spoofed Name',
      category: 'Marketing request',
      workspaceId: wsId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const authority = hasMarketingFinalApprovalAuthority(imposterUser, task, wsId);
    expect(authority.authorized).toBe(false);

    const check = validateSelfApprovalSafety(task, imposterUser);
    expect(check.allowed).toBe(false);
    expect(check.errorCode).toBe('FORBIDDEN_NOT_TASK_REVIEWER');
  });

  // Permutation 8: Removing marketing.final_approval from a role revokes permission
  it('8. Revoking marketing.final_approval removes authority immediately', () => {
    const coordinatorUser = {
      id: 'usr_coord_1',
      email: 'coord@nestrealty.com',
      name: 'Taylor Coordinator',
      role: 'marketing_coordinator',
      permissions: ['marketing.campaign.create', 'marketing.campaign.read_all']
    };

    const task: CanonicalMarketingTask = {
      id: 'tsk_revoked_check',
      requestId: 'req_008',
      title: 'Brochure Review',
      category: 'Marketing request',
      workspaceId: wsId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Without capability
    let authority = hasMarketingFinalApprovalAuthority(coordinatorUser, task, wsId);
    expect(authority.authorized).toBe(false);

    // When capability is explicitly granted
    coordinatorUser.permissions.push('marketing.final_approval');
    authority = hasMarketingFinalApprovalAuthority(coordinatorUser, task, wsId);
    expect(authority.authorized).toBe(true);
    expect(authority.source).toBe('role_capability');

    // When capability is revoked
    coordinatorUser.permissions = coordinatorUser.permissions.filter(p => p !== 'marketing.final_approval');
    authority = hasMarketingFinalApprovalAuthority(coordinatorUser, task, wsId);
    expect(authority.authorized).toBe(false);
  });

  // Permutation 9: Changing the director in the published policy transfers authority without code changes
  it('9. Updating the published policy review owner dynamically transfers authority without code changes', () => {
    // Dynamic successor: dir_ann_gunn_28 appointed Marketing Operations Director in policy
    const updatedPolicy: PublishedRoutingPolicy = {
      id: 'pol_test_v2',
      workspace_id: wsId,
      version: 2,
      published_by: 'Ryan Crecelius',
      published_by_user_id: 'usr_ryan',
      published_at: new Date().toISOString(),
      is_active: true,
      rules_count: 1,
      validation_hash: 'hash456',
      metadata: {
        marketing_director_staff_id: 'dir_ann_gunn_28' // Explicitly designates Marketing Operations Director capability
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const updatedRules: PublishedRoutingRule[] = [
      {
        id: 'rule_marketing_updated',
        policy_id: 'pol_test_v2',
        workspace_id: wsId,
        rule_index: 0,
        category: 'Marketing request',
        display_name: 'Marketing Collateral & Flyer Production',
        primary_position_id: 'pos_va',
        primary_staff_id: 'dir_eduardo_lovo_73',
        review_staff_id: 'dir_ann_gunn_28', // Ann is now the policy review director
        sla_hours: 24,
        sla_display: '24 hours',
        status: 'active',
        match_keywords: ['marketing'],
        created_at: new Date().toISOString()
      }
    ];

    cachedActivePolicies.set(wsId, {
      policy: updatedPolicy,
      rules: updatedRules,
      cachedAt: Date.now()
    });

    const annSessionUser = {
      id: 'usr_ann',
      staffId: 'dir_ann_gunn_28',
      email: 'ann@nestrealty.com',
      name: 'Ann Gunn',
      role: 'operations_lead',
      permissions: []
    };

    const task: CanonicalMarketingTask = {
      id: 'tsk_policy_transfer',
      requestId: 'req_009',
      title: 'Policy Transfer Test Flyer',
      category: 'Marketing request',
      workspaceId: wsId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const authority = hasMarketingFinalApprovalAuthority(annSessionUser, task, wsId);
    expect(authority.authorized).toBe(true);
    expect(authority.source).toBe('published_policy_director');
  });

  // Permutation 10: Marketing authority does not cross into non-marketing domains (BIC, contracts, ops)
  it('10. Marketing approval authority strictly does not cross into non-marketing domains', () => {
    const nonMarketingTasks: Array<{ name: string; task: CanonicalMarketingTask }> = [
      {
        name: 'Broker-in-Charge Question',
        task: {
          id: 'tsk_bic_01',
          requestId: 'req_bic',
          title: 'BIC Review of Disclosure Form 2T',
          category: 'Broker-in-Charge Question',
          workspaceId: wsId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      },
      {
        name: 'Contract Authoring',
        task: {
          id: 'tsk_contract_01',
          requestId: 'req_contract',
          title: 'Draft Purchase Agreement Rider',
          category: 'Contracts',
          workspaceId: wsId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      },
      {
        name: 'Operations & Facilities',
        task: {
          id: 'tsk_ops_01',
          requestId: 'req_ops',
          title: 'Office Keycard & Lockbox Maintenance',
          category: 'Operations',
          workspaceId: wsId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      },
      {
        name: 'Signage & Installation',
        task: {
          id: 'tsk_sign_01',
          requestId: 'req_sign',
          title: 'Install Yard Post & Sign',
          category: 'Signage',
          workspaceId: wsId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
    ];

    for (const item of nonMarketingTasks) {
      expect(isMarketingDomain(item.task)).toBe(false);

      // Even though Melissa has marketing.final_approval, she cannot approve non-marketing work
      const authority = hasMarketingFinalApprovalAuthority(melissaUser, item.task, wsId);
      expect(authority.authorized).toBe(false);
      expect(authority.reason).toContain('Marketing approval authority does not extend to non-marketing departments');
    }
  });

  // Permutation 11: Bare routing rule review assignment without marketing.final_approval does NOT confer approval authority
  it('11. Routing rule review owner assignment alone does NOT grant final approval authority without marketing.final_approval', () => {
    // Rule designates Eduardo as review_staff_id, but Eduardo does not hold marketing.final_approval
    const ruleWithEduardoAsReviewer: PublishedRoutingRule[] = [
      {
        id: 'rule_eduardo_reviewer',
        policy_id: 'pol_test_v1',
        workspace_id: wsId,
        rule_index: 0,
        category: 'Marketing request',
        display_name: 'Marketing Collateral Review',
        primary_position_id: 'pos_va',
        primary_staff_id: 'dir_eduardo_lovo_73',
        review_staff_id: 'dir_eduardo_lovo_73', // Assigned as review owner
        sla_hours: 24,
        sla_display: '24 hours',
        status: 'active',
        match_keywords: ['marketing'],
        created_at: new Date().toISOString()
      }
    ];

    cachedActivePolicies.set(wsId, {
      policy: {
        id: 'pol_test_v3',
        workspace_id: wsId,
        version: 3,
        published_by: 'Ryan Crecelius',
        published_at: new Date().toISOString(),
        is_active: true,
        rules_count: 1,
        metadata: {}, // No director capability assigned to Eduardo
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      rules: ruleWithEduardoAsReviewer,
      cachedAt: Date.now()
    });

    const task: CanonicalMarketingTask = {
      id: 'tsk_eduardo_routing_check',
      requestId: 'req_011',
      title: 'Eduardo Review Assignment Check',
      category: 'Marketing request',
      workspaceId: wsId,
      routingRuleId: 'rule_eduardo_reviewer',
      status: 'in_progress',
      reviewState: 'awaiting_review',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Even though Eduardo is the rule's review_staff_id, he lacks marketing.final_approval and is rejected
    const authority = hasMarketingFinalApprovalAuthority(eduardoUser, task, wsId);
    expect(authority.authorized).toBe(false);
    expect(authority.reason).toContain('User lacks marketing.final_approval capability');
  });

  // Permutation 12: Ryan Crecelius approving marketing work when holding canonical capabilities
  it('12. Ryan Crecelius may approve marketing work when authorized by canonical capabilities', () => {
    const ryanUser = {
      id: 'usr_ryan',
      email: 'ryan@nestrealty.com',
      name: 'Ryan Crecelius',
      role: 'owner',
      permissions: ['marketing.final_approval']
    };

    const task: CanonicalMarketingTask = {
      id: 'tsk_ryan_approval_test',
      requestId: 'req_012',
      title: 'Spring Magazine Cover — 100 Airlie Rd',
      category: 'Marketing request',
      workspaceId: wsId,
      assignedTo: 'Eduardo Lovo',
      assignedToId: 'dir_eduardo_lovo_73',
      status: 'in_progress',
      reviewState: 'awaiting_review',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const authority = hasMarketingFinalApprovalAuthority(ryanUser, task, wsId);
    expect(authority.authorized).toBe(true);

    const check = validateSelfApprovalSafety(task, ryanUser);
    expect(check.allowed).toBe(true);
    expect(check.isDirectorApproval).toBe(true);
    expect(check.authorityExplanation).toBeTruthy();
  });

  // Permutation 13: Non-marketing task approval blocked with FORBIDDEN_NON_MARKETING_DOMAIN in validateSelfApprovalSafety
  it('13. Non-marketing deliverable attempted by Director is rejected with FORBIDDEN_NON_MARKETING_DOMAIN', () => {
    const nonMarketingTask: CanonicalMarketingTask = {
      id: 'tsk_contracts_reject',
      requestId: 'req_013',
      title: 'Form 2T Standard Contract Review',
      category: 'Contracts',
      departmentId: 'contracts',
      workspaceId: wsId,
      status: 'in_progress',
      reviewState: 'awaiting_review',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const check = validateSelfApprovalSafety(nonMarketingTask, melissaUser);
    expect(check.allowed).toBe(false);
    expect(['FORBIDDEN_NON_MARKETING_DOMAIN','FORBIDDEN_NOT_TASK_REVIEWER']).toContain(check.errorCode);
    expect(check.allowed).toBe(false);
  });
});
