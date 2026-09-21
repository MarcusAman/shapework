
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const root = join(__dirname, '..');

describe('Nest ClickUp-simple pass', () => {
  it('Calls nav badge uses isCallFromToday only', () => {
    const src = readFileSync(join(root, 'components/marketing/MarketingIntakeConsole.tsx'), 'utf8');
    expect(src).toContain('countBadge = calls.filter(isCallFromToday).length');
    expect(src).not.toContain('telephonyLinkedOnBoard');
  });

  it('upload wizard uses quiet dismissible local-preview hint, not amber Cloud Object Storage error', () => {
    const src = readFileSync(join(root, 'components/marketing/ProofUploadWizard.tsx'), 'utf8');
    expect(src).toContain('local-preview-hint');
    expect(src).toContain('Local preview only');
    expect(src).not.toContain('Cloud Object Storage Notice');
    expect(src).not.toContain('bg-amber-50 border border-amber-200');
  });

  it('Melissa director CTA is Approve & Complete for submitted proofs', () => {
    const src = readFileSync(join(root, 'components/marketing/WorkspaceTaskDrawer.tsx'), 'utf8');
    expect(src).toContain("Approve & Complete");
    expect(src).toContain('isDirectorReviewingSubmittedProof');
    expect(src).toContain('assigneeLooksLikeMarketingDirector');
    expect(src).not.toContain("Approve & Send to Requester");
  });

  it('VA workspace Melissa tab drives drawer Approve authority', () => {
    const src = readFileSync(join(root, 'components/marketing/VAWorkspaceView.tsx'), 'utf8');
    expect(src).toContain('drawerCurrentUser');
    expect(src).toContain("currentUser={drawerCurrentUser}");
  });

  it('All Tasks hides prior-day approved/done unless searching or Approved filter', () => {
    const src = readFileSync(join(root, 'components/marketing/MarketingHomeInbox.tsx'), 'utf8');
    expect(src).toContain('Day rollover');
    expect(src).toContain('startOfTodayMs');
    expect(src).toContain('past completed');
  });

  it('proof card keeps Preview primary before Download', () => {
    const src = readFileSync(join(root, 'components/marketing/WorkspaceTaskDrawer.tsx'), 'utf8');
    expect(src).toContain('collateral-proof-card');
    const idxPreview = src.indexOf('<span>Preview</span>');
    const idxDownload = src.indexOf('<span>Download</span>');
    expect(idxPreview).toBeGreaterThan(0);
    expect(idxDownload).toBeGreaterThan(idxPreview);
  });
});

  it('Table list view groups tasks by Nest pipeline lanes (ClickUp-style)', () => {
    const src = readFileSync(join(root, 'components/marketing/MarketingHomeInbox.tsx'), 'utf8');
    expect(src).toContain('tableLaneGroups');
    expect(src).toContain('list-lane-header-');
    expect(src).toContain('toggleListLaneCollapse');
    expect(src).toContain('data-grouped-list="true"');
  });

  it('Table nests sibling deliverables under parent request accordion', () => {
    const src = readFileSync(join(root, 'components/marketing/MarketingHomeInbox.tsx'), 'utf8');
    expect(src).toContain('buildLaneListItems');
    expect(src).toContain('list-request-accordion-');
    expect(src).toContain('toggleRequestAccordion');
    expect(src).toContain('subtask');
  });

  it('Call intake enqueues AskNora photo_request when no listing photos', () => {
    const src = readFileSync(join(root, '../server/persistence/marketingCampaignsRepository.ts'), 'utf8');
    expect(src).toContain("messageType: 'photo_request'");
    expect(src).toContain('photo_request:v1');
  });

  it('session identity cache stores user object and clears on login helpers', () => {
    const src = readFileSync(join(root, 'state/useWorkspaceConsoleState.ts'), 'utf8');
    expect(src).toContain('clearWorkspaceConsoleCaches');
    expect(src).toContain('fetchAuthSessionUser');
    expect(src).toContain('cachedAuthSessionUser');
    expect(src).not.toContain('|| data.profiles[0]');
  });

  it('Workspace tab is folded into Tasks (no separate Workspace pill)', () => {
    const src = readFileSync(join(root, 'components/marketing/marketingSubtabs.ts'), 'utf8');
    expect(src).toContain('{ id: "requests", label: "Tasks" }');
    expect(src).not.toMatch(/label:\s*"Workspace"/);
    expect(src).toContain('va: "requests"');
  });


describe('Nest MLS photo unlock + Tasks workstation unify', () => {
  it('MLS photo policy + Tasks opens workstation', () => {
    const drawer = readFileSync(join(root, 'components/marketing/WorkspaceTaskDrawer.tsx'), 'utf8');
    expect(drawer).toContain('hasMlsOnFile');
    expect(drawer).toContain('mls-photos-unlock-panel');
    expect(drawer).toContain('missing-photos-nora-panel');
    expect(drawer).toContain('resend-photo-request');
    expect(drawer).toMatch(/hasPhotosOrOverride[\s\S]{0,200}hasMlsOnFile/);

    const inbox = readFileSync(join(root, 'components/marketing/MarketingHomeInbox.tsx'), 'utf8');
    expect(inbox).toContain('toWorkspaceDrawerTask');
    expect(inbox).toContain('setIsWorkstationOpen(true)');
    expect(inbox).toContain('<WorkspaceTaskDrawer');
    expect(inbox).toContain('isWorkstationOpen && workstationTask');
  });

  it('toWorkspaceDrawerTask maps MLS and parent photos', async () => {
    const mod = await import('../components/marketing/MarketingHomeInbox');
    const mapped = mod.toWorkspaceDrawerTask(
      {
        id: 'task_1',
        title: 'Flyer',
        createdAt: '2026-09-16T12:00:00Z',
        updatedAt: '2026-09-16T12:00:00Z',
        photos: [],
        mlsNumber: ''
      } as any,
      {
        id: 'req_1',
        title: 'OH',
        agentName: 'Alex',
        mlsNumber: 'MLS #123456',
        photos: [{ id: 'p1', url: 'https://example.com/a.jpg' }]
      } as any
    );
    expect(mapped.listingDetails.mlsNumber).toContain('123456');
    expect(mapped.photos.length).toBe(1);
    expect(mapped.requestId).toBe('req_1');
  });
});

describe('Nest Melissa always reviewing manager', () => {
  it('drawer defaults marketing review manager to Melissa; repo heals on save/load', () => {
    const drawer = readFileSync(join(root, 'components/marketing/WorkspaceTaskDrawer.tsx'), 'utf8');
    expect(drawer).toContain('marketing tasks ALWAYS review to Melissa');
    expect(drawer).toContain('dir_melissa_gagliardi_33');
    expect(drawer).not.toMatch(/coveringManagerDisplay = activeTask\.reviewOwnerId\s*\?[\s\S]*: 'Review manager not assigned'/);

    const repo = readFileSync(join(root, '../server/persistence/marketingCampaignsRepository.ts'), 'utf8');
    expect(repo).toContain('export function ensureMarketingReviewOwner');
    expect(repo).toContain('ensureMarketingReviewOwner(task)');
    expect(repo).toContain('ensureMarketingReviewOwner(t)');

    const inbox = readFileSync(join(root, 'components/marketing/MarketingHomeInbox.tsx'), 'utf8');
    expect(inbox).toContain("reviewOwnerId: task.reviewOwnerId && !String(task.reviewOwnerId).includes('_test_')");
  });
});

describe('Nest proof upload not blocked by optional URL', () => {
  it('approve-and-dispatch sends stagedAssets; URL field is optional', () => {
    const drawer = readFileSync(join(root, 'components/marketing/WorkspaceTaskDrawer.tsx'), 'utf8');
    expect(drawer).toContain('Image / file link (optional');
    expect(drawer).toContain('selfComplete: isDirectorSelfComplete');
    expect(drawer).toContain('stagedAssets: stagedAssets.length > 0 ? stagedAssets : undefined');

    const inbox = readFileSync(join(root, 'components/marketing/MarketingHomeInbox.tsx'), 'utf8');
    expect(inbox).toContain('onApproveAndDispatch={async (taskId, note, opts)');
    expect(inbox).toContain('stagedAssets: opts?.stagedAssets');

    const server = readFileSync(join(root, '../server.ts'), 'utf8');
    expect(server).toContain('staged0.previewUrl || staged0.downloadUrl || staged0.url');
  });
});

describe('Nest ClickUp-simple workstation chunks', () => {
  it('drawer uses What / Who·When / Work chunks and footer Close-left', () => {
    const drawer = readFileSync(join(root, 'components/marketing/WorkspaceTaskDrawer.tsx'), 'utf8');
    expect(drawer).toContain('data-testid="workstation-chunks"');
    expect(drawer).toContain('data-testid="chunk-what"');
    expect(drawer).toContain('data-testid="chunk-who-when"');
    expect(drawer).toContain('data-testid="chunk-work"');
    expect(drawer).toContain('data-testid="workstation-footer"');
    expect(drawer).toContain('Inspect Full IDs');
    expect(drawer).toContain('Finished proof');
    expect(drawer).toContain('Brief &amp; copy');
    // Ask Requester demoted to overflow
    expect(drawer).toContain('Ask Requester moved to');
  });
});

describe('Nest History Details proof-first', () => {
  it('activity Details leads with call/email proof; tech collapsed; secondary nav hidden', () => {
    const timeline = readFileSync(join(root, 'components/marketing/ActivityAndContactTimeline.tsx'), 'utf8');
    expect(timeline).toContain('activity-details-call-proof');
    expect(timeline).toContain('activity-details-email-proof');
    expect(timeline).toContain('activity-details-tech-toggle');
    expect(timeline).toContain('Call recording &amp; transcript');
    expect(timeline).toContain('sourceMedia');

    const drawer = readFileSync(join(root, 'components/marketing/WorkspaceTaskDrawer.tsx'), 'utf8');
    expect(drawer).toContain('sourceMedia={{');
    expect(drawer).toContain('drawer-legacy-tab-anchors');
    expect(drawer).toContain('className="hidden" aria-hidden="true" data-testid="drawer-legacy-tab-anchors"');
    expect(drawer).toContain('approve-disabled-reason');
    expect(drawer).toContain('checklistCollapsed');
  });
});

describe('Nest MLS badge nesting', () => {
  it('MlsNumberBadge has no nested button', () => {
    const badge = readFileSync(join(root, 'components/marketing/MlsNumberBadge.tsx'), 'utf8');
    expect(badge).not.toMatch(/<button[\s>]/);
    expect(badge).toContain('data-mls-copy');
    const inbox = readFileSync(join(root, 'components/marketing/MarketingHomeInbox.tsx'), 'utf8');
    expect(inbox).toContain('list-request-accordion-');
    expect(inbox).toMatch(/list-request-accordion-[\s\S]{0,400}role="button"/);
  });
});
