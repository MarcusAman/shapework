import { describe, it, expect } from 'vitest';
import { isTaskInMemberWorkspace, resolveCanonicalStaffMember } from '../services/canonicalRoster';
import { recoverInvisibleAwaitingReviewSubmissions } from '../../server/persistence/marketingCampaignsRepository';

describe('Nest remaining workflow fixes', () => {
  it('does not divert Melissa reviews to Ann via stale coveringStaff when coverage is Normal', () => {
    const ann = resolveCanonicalStaffMember('dir_ann_gunn_28') || { id: 'dir_ann_gunn_28', name: 'Ann Gunn' };
    const melissa = resolveCanonicalStaffMember('dir_melissa_gagliardi_33')!;
    const task = {
      id: 't_cov',
      assignedTo: 'Eduardo Lovo',
      assignedToId: 'dir_eduardo_lovo_73',
      reviewOwnerId: 'dir_melissa_gagliardi_33',
      reviewOwnerName: 'Melissa Gagliardi',
      status: 'in_progress',
      reviewState: 'awaiting_review',
      category: 'print',
      coveringStaff: 'Ann Gunn',
      coveringStaffId: 'dir_ann_gunn_28',
      coveringStaffName: 'Ann Gunn',
      // coverageActive intentionally omitted / false → Normal
      isArchived: false
    };
    expect(isTaskInMemberWorkspace(task, melissa)).toBe(true);
    // Ann should NOT receive this as coverage when Normal
    expect(isTaskInMemberWorkspace(task, ann as any, { coverageFilter: 'coverage' })).toBe(false);
  });

  it('dry-run recovery identifies archived awaiting-review proofs without mutating when dryRun=true', () => {
    const result = recoverInvisibleAwaitingReviewSubmissions({ dryRun: true, limit: 20 });
    expect(result).toHaveProperty('recovered');
    expect(result).toHaveProperty('skipped');
    // Should not throw; recovered entries (if any) remain archived in dry-run
    for (const t of result.recovered) {
      expect(String(t.reviewState)).toBe('awaiting_review');
      expect(Number(t.proofVersion || 0)).toBeGreaterThanOrEqual(1);
    }
  });

  it('locks ProofUploadWizard directly to task deliverable (e.g. Tri-fold Brochure) and skips step 1', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { ProofUploadWizard } = await import('../components/marketing/ProofUploadWizard');

    const html = renderToStaticMarkup(
      React.createElement(ProofUploadWizard, {
        isOpen: true,
        onClose: () => {},
        onAssetConfirmed: () => {},
        currentUser: { id: 'usr_1', name: 'Eduardo' },
        requestedDeliverables: [{ name: 'Tri-fold Brochure', format: 'PDF' }],
        lockedDeliverableName: 'Tri-fold Brochure',
        storageConfigured: false
      })
    );

    // Starts at Step 2 directly, not Step 1
    expect(html).toContain('Step 2 of 4: Choose or Drop File');
    expect(html).not.toContain('Select which package collateral item this finished proof satisfies');
  });

  it('renders "Deadline not specified" instead of invented "Today 5:00 PM"', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { WorkspaceTaskDrawer } = await import('../components/marketing/WorkspaceTaskDrawer');

    const html = renderToStaticMarkup(
      React.createElement(WorkspaceTaskDrawer, {
        isOpen: true,
        activeTask: {
          id: 'tsk_sla_test',
          campaignId: 'c1',
          propertyAddress: '100 Main St',
          packageType: 'Tri-fold Brochure',
          priority: 'normal',
          status: 'in_progress',
          targetSla: 'Today 5:00 PM', // Legacy invented SLA
          receivedAt: 'Today',
          assignedTo: 'Melissa Gagliardi',
          assignedToId: 'dir_melissa_gagliardi_33',
          requestedAssets: [{ name: 'Tri-fold Brochure' }]
        } as any,
        onClose: () => {}
      })
    );

    expect(html).toContain('Deadline not specified');
    expect(html).not.toContain('SLA Due: Today 5:00 PM');
  });
});


