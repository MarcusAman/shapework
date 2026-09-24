/**
 * Marketing Approve & Notify role + Drive fail-closed gate (Feature Lab / Blueprint ADR).
 * Harness-first: assignee must never Approve & Notify; only task.reviewerId may;
 * Drive stub/empty must refuse server-side.
 */
import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { WorkspaceTaskDrawer, WorkspaceDrawerTask } from '../components/marketing/WorkspaceTaskDrawer';
import {
  resolveMarketingApproveNotifyCapabilities,
  assertActorIsTaskReviewerForApproveNotify,
} from '../lib/marketingApproveNotifyCapabilities';
import {
  assertDriveReadyForApproveNotify,
  isPlaceholderDriveUrl,
  isRealGoogleDriveUrl,
} from '../../server/services/askNoraDriveDelivery';
import { validateSelfApprovalSafety } from '../../server/policies/canonicalMarketingLifecyclePolicy';
import { isAllowedCustomerRole } from '../utils/sandboxIdentity';

function peachtreeTask(overrides: Partial<WorkspaceDrawerTask> = {}): WorkspaceDrawerTask {
  return {
    id: 'req_email_1790263265506_r8nhi__Tri-fold brochure',
    campaignId: 'camp_peachtree_role_gate',
    propertyAddress: '7174 Peachtree Way, Wilmington, NC 28403',
    agentName: 'Marcus Aman',
    agentPhone: '(910) 555-0100',
    agentEmail: 'marcus.aman@gmail.com',
    agentRole: 'Requester',
    packageType: 'Tri-fold brochure',
    priority: 'normal',
    status: 'in_production',
    reviewState: undefined,
    proofVersion: 1,
    targetSla: 'Deadline not specified',
    receivedAt: 'Today',
    assignedTo: 'Eduardo Lovo',
    assignedToId: 'dir_eduardo_lovo_73',
    assignedToRole: 'Virtual Assistant / Production Specialist',
    reviewOwnerId: 'dir_melissa_gagliardi_33',
    reviewOwnerName: 'Melissa Gagliardi',
    proofUrl: '/uploads/Test_marcusgmail.png',
    proofNotes: '',
    proofHistory: [
      {
        version: 1,
        proofUrl: '/uploads/Test_marcusgmail.png',
        uploadedBy: 'Eduardo Lovo',
        uploadedById: 'dir_eduardo_lovo_73',
        uploadedAt: new Date().toISOString(),
        notes: 'Finished asset staged',
      },
    ],
    requestedAssets: [{ name: 'Tri-fold brochure', format: 'PDF', dimensions: 'tri-fold' }],
    listingDetails: {
      price: '',
      bedsBaths: '',
      sqft: '',
      headline: 'Open house collateral',
      description: 'Peachtree open house',
      disclosures: 'Nest Realty',
      mlsNumber: '',
      licenseNumber: '',
    },
    photos: [],
    sopCode: 'sop_marketing_intake_003',
    sopTitle: 'Governing Standard Operating Procedure',
    category: 'print',
    ...overrides,
  } as WorkspaceDrawerTask;
}

describe('marketingApproveNotifyCapabilities — role gate', () => {
  const task = peachtreeTask();

  it('assignee Eduardo never gets Approve & Notify (submit only)', () => {
    const caps = resolveMarketingApproveNotifyCapabilities(
      { id: 'dir_eduardo_lovo_73', name: 'Eduardo Lovo', role: 'producer' },
      task
    );
    expect(caps.isAssignee).toBe(true);
    expect(caps.isReviewer).toBe(false);
    expect(caps.canApproveAndNotify).toBe(false);
    expect(caps.canSubmitToReviewer).toBe(true);
    expect(caps.primaryCta).toBe('submit_to_reviewer');
  });

  it('reviewer Melissa gets Approve & Notify + revisions', () => {
    const caps = resolveMarketingApproveNotifyCapabilities(
      {
        id: 'dir_melissa_gagliardi_33',
        name: 'Melissa Gagliardi',
        role: 'marketing_director',
      },
      task
    );
    expect(caps.isReviewer).toBe(true);
    expect(caps.canApproveAndNotify).toBe(true);
    expect(caps.canRequestRevisions).toBe(true);
    expect(caps.canSubmitToReviewer).toBe(false);
    expect(caps.primaryCta).toBe('approve_and_notify');
  });

  it('assignee+reviewer same person → reviewer caps (no submit-to-self)', () => {
    const self = peachtreeTask({
      assignedTo: 'Melissa Gagliardi',
      assignedToId: 'dir_melissa_gagliardi_33',
    });
    const caps = resolveMarketingApproveNotifyCapabilities(
      { id: 'dir_melissa_gagliardi_33', name: 'Melissa Gagliardi', role: 'marketing_director' },
      self
    );
    expect(caps.isAssignee).toBe(true);
    expect(caps.isReviewer).toBe(true);
    expect(caps.canApproveAndNotify).toBe(true);
    expect(caps.canSubmitToReviewer).toBe(false);
  });

  it('marketing_director who is NOT task.reviewerId cannot approve', () => {
    const caps = resolveMarketingApproveNotifyCapabilities(
      {
        id: 'dir_marcus_aman',
        name: 'Marcus Aman',
        role: 'marketing_director',
      },
      task
    );
    expect(caps.canApproveAndNotify).toBe(false);
    const gate = assertActorIsTaskReviewerForApproveNotify(
      { id: 'dir_marcus_aman', name: 'Marcus Aman', role: 'marketing_director' },
      task
    );
    expect(gate.allowed).toBe(false);
    expect(gate.errorCode).toBe('FORBIDDEN_NOT_TASK_REVIEWER');
  });

  it('server gate rejects assignee Eduardo even with director title', () => {
    const gate = assertActorIsTaskReviewerForApproveNotify(
      { id: 'dir_eduardo_lovo_73', name: 'Eduardo Lovo', role: 'marketing_director' },
      task
    );
    expect(gate.allowed).toBe(false);
    expect(gate.errorCode).toBe('FORBIDDEN_NOT_TASK_REVIEWER');
  });
});

describe('assertDriveReadyForApproveNotify — fail-closed outbound', () => {
  it('rejects stub pack', () => {
    const gate = assertDriveReadyForApproveNotify({ stub: true, linkable: false });
    expect(gate.allowed).toBe(false);
    expect(gate.errorCode).toBe('DRIVE_STUB');
  });

  it('rejects 1DRV_ synthetic folder urls', () => {
    expect(isPlaceholderDriveUrl('https://drive.google.com/drive/folders/1DRV_PEACHTREE')).toBe(true);
    expect(isRealGoogleDriveUrl('https://drive.google.com/drive/folders/1DRV_PEACHTREE')).toBe(false);
    const gate = assertDriveReadyForApproveNotify({
      driveFolderUrl: 'https://drive.google.com/drive/folders/1DRV_PEACHTREE',
      driveFolderId: '1DRV_PEACHTREE',
      linkable: true,
      fileCount: 3,
    });
    expect(gate.allowed).toBe(false);
    expect(gate.errorCode).toBe('DRIVE_STUB_OR_MISSING');
  });

  it('rejects empty / non-linkable real-looking folder', () => {
    const gate = assertDriveReadyForApproveNotify({
      driveFolderUrl: 'https://drive.google.com/drive/folders/1abcRealFolderId999',
      driveFolderId: '1abcRealFolderId999',
      linkable: false,
      fileCount: 0,
      uploaded: [],
    });
    expect(gate.allowed).toBe(false);
    expect(gate.errorCode).toBe('DRIVE_EMPTY');
  });

  it('allows real folder id with ≥1 file and linkable', () => {
    const gate = assertDriveReadyForApproveNotify({
      driveFolderUrl: 'https://drive.google.com/drive/folders/1abcRealFolderId999',
      driveFolderId: '1abcRealFolderId999',
      linkable: true,
      fileCount: 1,
    });
    expect(gate.allowed).toBe(true);
  });
});

describe('WorkspaceTaskDrawer — Approve & Notify visibility by task role', () => {
  const task = peachtreeTask();

  it('hides Approve & Notify from Eduardo assignee (In production + proof)', () => {
    const html = renderToStaticMarkup(
      <WorkspaceTaskDrawer
        isOpen={true}
        activeTask={task}
        onClose={() => {}}
        currentUser={{
          id: 'dir_eduardo_lovo_73',
          name: 'Eduardo Lovo',
          role: 'producer',
          email: 'eduardo.lovo@nestrealty.com',
          permissions: ['marketing.create', 'marketing.edit'],
        }}
      />
    );
    expect(html).not.toContain('Approve &amp; Notify Agent');
    expect(html).not.toMatch(/data-action="Approve &amp; send to agent"/);
  });

  it('hides Approve & Notify from marketing_director who is not the reviewer', () => {
    const html = renderToStaticMarkup(
      <WorkspaceTaskDrawer
        isOpen={true}
        activeTask={task}
        onClose={() => {}}
        currentUser={{
          id: 'dir_marcus_aman',
          name: 'Marcus Aman',
          role: 'marketing_director',
          email: 'marcus@capefearai.com',
          permissions: ['marketing.final_approval', 'marketing.approve'],
        }}
      />
    );
    // Right fail reason pre-fix: global marketing_director previously unlocked Approve.
    expect(html).not.toContain('Approve &amp; Notify Agent');
  });

  it('shows Approve & Notify for Melissa task reviewer', () => {
    const html = renderToStaticMarkup(
      <WorkspaceTaskDrawer
        isOpen={true}
        activeTask={task}
        onClose={() => {}}
        currentUser={{
          id: 'dir_melissa_gagliardi_33',
          name: 'Melissa Gagliardi',
          role: 'marketing_director',
          email: 'melissa@nestrealty.com',
          permissions: ['marketing.final_approval', 'marketing.approve'],
        }}
      />
    );
    expect(html).toContain('Approve &amp; Notify Agent');
  });
});


describe('WorkspaceTaskDrawer — live corrupt assignedToId (Eduardo name / Melissa id)', () => {
  /** Mirrors Peachtree after name-only reassign left Melissa's id on Eduardo's task. */
  const liveCorrupt = peachtreeTask({
    status: 'in_production',
    assignedTo: 'Eduardo Lovo',
    assignedToId: 'dir_melissa_gagliardi_33',
    reviewOwnerId: 'dir_melissa_gagliardi_33',
    reviewOwnerName: 'Melissa Gagliardi',
    proofUrl: '/uploads/Test_marcusgmail.png',
    proofVersion: 1,
  });

  it('Eduardo-as-actor never sees Approve & Notify (name wins over corrupt id)', () => {
    const caps = resolveMarketingApproveNotifyCapabilities(
      { id: 'dir_eduardo_lovo_73', name: 'Eduardo Lovo', role: 'producer' },
      liveCorrupt
    );
    expect(caps.isAssignee).toBe(true);
    expect(caps.isReviewer).toBe(false);
    expect(caps.canApproveAndNotify).toBe(false);
    expect(caps.canSubmitToReviewer).toBe(true);

    const html = renderToStaticMarkup(
      <WorkspaceTaskDrawer
        isOpen={true}
        activeTask={liveCorrupt}
        onClose={() => {}}
        currentUser={{
          id: 'dir_eduardo_lovo_73',
          name: 'Eduardo Lovo',
          role: 'producer',
          email: 'eduardo.lovo@nestrealty.com',
          permissions: ['marketing.create', 'marketing.edit'],
        }}
      />
    );
    expect(html).not.toContain('Approve &amp; Notify Agent');
    expect(html).toContain('Send for review');
    expect(html).not.toContain('Send to Manager');
  });

  it('Melissa-as-reviewer still sees Approve (corrupt assignee id must not steal reviewer CTA)', () => {
    const caps = resolveMarketingApproveNotifyCapabilities(
      {
        id: 'dir_melissa_gagliardi_33',
        name: 'Melissa Gagliardi',
        role: 'marketing_director',
      },
      liveCorrupt
    );
    // Name says Eduardo — Melissa is reviewer only, not false same-person assignee.
    expect(caps.isAssignee).toBe(false);
    expect(caps.isReviewer).toBe(true);
    expect(caps.canApproveAndNotify).toBe(true);

    const html = renderToStaticMarkup(
      <WorkspaceTaskDrawer
        isOpen={true}
        activeTask={liveCorrupt}
        onClose={() => {}}
        currentUser={{
          id: 'dir_melissa_gagliardi_33',
          name: 'Melissa Gagliardi',
          role: 'marketing_director',
          email: 'melissa@nestrealty.com',
          permissions: ['marketing.final_approval', 'marketing.approve'],
        }}
      />
    );
    expect(html).toContain('Approve &amp; Notify Agent');
  });

  it('drawer source: openDeliveryOutreach + approve handler fail-closed on canApproveAndNotify', async () => {
    const fs = await import('fs');
    const pathMod = await import('path');
    const src = fs.readFileSync(
      pathMod.resolve(__dirname, '../components/marketing/WorkspaceTaskDrawer.tsx'),
      'utf8'
    );
    expect(src).toMatch(/openDeliveryOutreach[\s\S]*?if\s*\(\s*!canApproveAndNotify\s*\)/);
    expect(src).toMatch(/handleApproveAndSendToAgent[\s\S]*?if\s*\(\s*!canApproveAndNotify\s*\)/);
    expect(src).not.toMatch(/reviewerStaff && \([\s\S]*?marketing director/);
  });
});


describe('ADR — producer workboard access (upload + submit-to-reviewer)', () => {
  it('producer role is allowed on customer workboard / Tasks surface', () => {
    expect(isAllowedCustomerRole('producer')).toBe(true);
  });

  it('assignee Eduardo retains submit-to-reviewer + upload (Approve & Notify still gated)', () => {
    const task = peachtreeTask({ status: 'in_production', reviewState: undefined });
    const caps = resolveMarketingApproveNotifyCapabilities(
      { id: 'dir_eduardo_lovo_73', name: 'Eduardo Lovo', role: 'producer' },
      task
    );
    expect(caps.canUpload).toBe(true);
    expect(caps.canSubmitToReviewer).toBe(true);
    expect(caps.canApproveAndNotify).toBe(false);
  });
});

describe('ADR — DROP FORBIDDEN_SELF_APPROVAL (reviewer id SoT)', () => {
  it('Melissa reviewer who is also assignee MAY Approve & Notify (self-serve lock)', () => {
    const selfServe = peachtreeTask({
      assignedTo: 'Melissa Gagliardi',
      assignedToId: 'dir_melissa_gagliardi_33',
      reviewOwnerId: 'dir_melissa_gagliardi_33',
      reviewOwnerName: 'Melissa Gagliardi',
    });
    const caps = resolveMarketingApproveNotifyCapabilities(
      { id: 'dir_melissa_gagliardi_33', name: 'Melissa Gagliardi', role: 'marketing_director' },
      selfServe
    );
    expect(caps.isAssignee).toBe(true);
    expect(caps.isReviewer).toBe(true);
    expect(caps.canApproveAndNotify).toBe(true);

    const safety = validateSelfApprovalSafety(selfServe as any, {
      id: 'dir_melissa_gagliardi_33',
      name: 'Melissa Gagliardi',
      role: 'marketing_director',
    } as any);
    expect(safety.allowed).toBe(true);
    expect(safety.errorCode).not.toBe('FORBIDDEN_SELF_APPROVAL');
  });

  it('non-reviewer Eduardo is refused with FORBIDDEN_NOT_TASK_REVIEWER (not SELF_APPROVAL)', () => {
    const task = peachtreeTask();
    const safety = validateSelfApprovalSafety(task as any, {
      id: 'dir_eduardo_lovo_73',
      name: 'Eduardo Lovo',
      role: 'producer',
    } as any);
    expect(safety.allowed).toBe(false);
    expect(safety.errorCode).toBe('FORBIDDEN_NOT_TASK_REVIEWER');
    expect(safety.errorCode).not.toBe('FORBIDDEN_SELF_APPROVAL');
  });
});



describe('WorkspaceTaskDrawer — Live Oak producer Send for review (in_production + staged proof)', () => {
  /** QA reopen: 1104 South Live Oak — Eduardo assignee, Melissa reviewer, In production + staged proof */
  function liveOakTask(overrides: Partial<WorkspaceDrawerTask> = {}): WorkspaceDrawerTask {
    return peachtreeTask({
      id: 'task_call_call_01029eb55179e9b49d2c93deea7_0',
      campaignId: 'camp_live_oak_role_gate',
      propertyAddress: '1104 South Live Oak Parkway, Wilmington, NC',
      agentName: 'Marcus Aman',
      packageType: 'Open House Flyer & Information Sheet',
      status: 'in_production',
      reviewState: undefined,
      proofVersion: 1,
      assignedTo: 'Eduardo Lovo',
      assignedToId: 'dir_eduardo_lovo_73',
      assignedToRole: 'Virtual Assistant & Marketing Production',
      reviewOwnerId: 'dir_melissa_gagliardi_33',
      reviewOwnerName: 'Melissa Gagliardi',
      proofUrl: '/uploads/Test_marcusgmail.png',
      proofNotes: 'Finished open house flyer staged',
      proofHistory: [
        {
          version: 1,
          proofUrl: '/uploads/Test_marcusgmail.png',
          uploadedBy: 'Eduardo Lovo',
          uploadedById: 'dir_eduardo_lovo_73',
          uploadedAt: new Date().toISOString(),
          notes: 'Finished asset staged',
        },
      ],
      requestedAssets: [
        { name: 'Open House Flyer', format: 'PDF', dimensions: 'letter' },
        { name: 'Information Sheet', format: 'PDF', dimensions: 'letter' },
      ],
      listingDetails: {
        price: '',
        bedsBaths: '',
        sqft: '',
        headline: 'Open House Flyer & Information Sheet',
        description: '1104 South Live Oak Parkway',
        disclosures: 'Nest Realty',
        mlsNumber: '',
        licenseNumber: '',
      },
      sopCode: 'sop_marketing_intake_003',
      sopTitle: 'Governing Standard Operating Procedure',
      category: 'print',
      ...overrides,
    } as WorkspaceDrawerTask);
  }

  const task = liveOakTask();

  it('actor=Eduardo (assignee ≠ reviewer) → primary CTA Send for review; Approve & Notify hidden', () => {
    const caps = resolveMarketingApproveNotifyCapabilities(
      { id: 'dir_eduardo_lovo_73', name: 'Eduardo Lovo', role: 'producer' },
      task
    );
    expect(caps.isAssignee).toBe(true);
    expect(caps.isReviewer).toBe(false);
    expect(caps.canSubmitToReviewer).toBe(true);
    expect(caps.canApproveAndNotify).toBe(false);
    expect(caps.primaryCta).toBe('submit_to_reviewer');

    const html = renderToStaticMarkup(
      <WorkspaceTaskDrawer
        isOpen={true}
        activeTask={task}
        onClose={() => {}}
        currentUser={{
          id: 'dir_eduardo_lovo_73',
          name: 'Eduardo Lovo',
          role: 'producer',
          email: 'eduardo@nestrealty.com',
          permissions: ['marketing.create', 'marketing.edit'],
        }}
      />
    );
    expect(html).toContain('Send for review');
    expect(html).toContain('data-action="Send for review"');
    expect(html).not.toContain('Approve &amp; Notify Agent');
    expect(html).not.toContain('Send to Manager');
  });

  it('actor=Melissa (session === reviewerId) → Approve & Notify; Send for review hidden', () => {
    const caps = resolveMarketingApproveNotifyCapabilities(
      {
        id: 'dir_melissa_gagliardi_33',
        name: 'Melissa Gagliardi',
        role: 'marketing_director',
      },
      task
    );
    expect(caps.isReviewer).toBe(true);
    expect(caps.canApproveAndNotify).toBe(true);
    expect(caps.canSubmitToReviewer).toBe(false);
    expect(caps.primaryCta).toBe('approve_and_notify');

    const html = renderToStaticMarkup(
      <WorkspaceTaskDrawer
        isOpen={true}
        activeTask={task}
        onClose={() => {}}
        currentUser={{
          id: 'dir_melissa_gagliardi_33',
          name: 'Melissa Gagliardi',
          role: 'marketing_director',
          email: 'melissa.gagliardi@nestrealty.com',
          permissions: ['marketing.final_approval', 'marketing.approve'],
        }}
      />
    );
    expect(html).toContain('Approve &amp; Notify Agent');
    expect(html).not.toContain('data-action="Send for review"');
    expect(html).not.toContain('>Send for review<');
  });

  it('Ids are SoT: CTA = f(actor, reviewerId, assigneeId) — never staff title alone', () => {
    const directorNotReviewer = resolveMarketingApproveNotifyCapabilities(
      { id: 'dir_marcus_aman', name: 'Marcus Aman', role: 'marketing_director' },
      task
    );
    expect(directorNotReviewer.canApproveAndNotify).toBe(false);
    expect(directorNotReviewer.canSubmitToReviewer).toBe(false);
    expect(directorNotReviewer.primaryCta).toBe('none');

    const html = renderToStaticMarkup(
      <WorkspaceTaskDrawer
        isOpen={true}
        activeTask={task}
        onClose={() => {}}
        currentUser={{
          id: 'dir_marcus_aman',
          name: 'Marcus Aman',
          role: 'marketing_director',
          email: 'marcus@capefearai.com',
          permissions: ['marketing.final_approval', 'marketing.approve'],
        }}
      />
    );
    expect(html).not.toContain('Approve &amp; Notify Agent');
    expect(html).not.toContain('data-action="Send for review"');
  });
});

describe('assign write-path — Eduardo name must persist Eduardo id (not reviewer id)', () => {
  it('name/id conflict with sticky reviewer id prefers Eduardo directory id', async () => {
    const { resolveStaffMember } = await import('../../server/persistence/operationsDirectoryRepository');
    const byName = resolveStaffMember('Eduardo Lovo', 'ws_wilmington');
    const byReviewer = resolveStaffMember('dir_melissa_gagliardi_33', 'ws_wilmington');
    expect(byName?.id).toBe('dir_eduardo_lovo_73');
    expect(byReviewer?.id).toBe('dir_melissa_gagliardi_33');
    const reviewerSticky = byReviewer!.id === 'dir_melissa_gagliardi_33';
    const resolved = reviewerSticky ? byName : byReviewer;
    expect(resolved?.id).toBe('dir_eduardo_lovo_73');
    expect(resolved?.fullName).toMatch(/Eduardo/i);
  });
});
