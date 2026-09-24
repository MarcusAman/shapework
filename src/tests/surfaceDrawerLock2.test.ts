/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Surface drawer lock #2 — Mode A triage + Mode B shells (Marcus GO / Surface)
 * Harness-first: unit gates on surfaceDrawerLock2 + source wiring in WorkspaceTaskDrawer.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  SURFACE_DRAWER_CONFIRM_ROUTING_LABEL,
  SURFACE_DRAWER_NEEDS_TRIAGE_CHIP,
  SURFACE_DRAWER_TRIAGE_BODY,
  isChasePhotosNext,
  isPlaceholderDrawerAddress,
  isSurfaceDrawerTriageTask,
  resolveSurfaceDrawerDeliverableTitle,
  resolveSurfaceDrawerGates,
  resolveSurfaceDrawerH1,
  resolveSurfaceDrawerLaneChip,
  resolveSurfaceDrawerNext,
  resolveSurfaceDrawerShell,
  resolveSurfaceDrawerTriageBody,
  sanitizeTriageReasonForDisplay,
  type SurfaceDrawerTaskLike,
} from '../lib/surfaceDrawerLock2';

const root = join(__dirname, '..');
const drawerSrc = readFileSync(
  join(root, 'components/marketing/WorkspaceTaskDrawer.tsx'),
  'utf8'
);
const helperSrc = readFileSync(join(root, 'lib/surfaceDrawerLock2.ts'), 'utf8');

function task(partial: SurfaceDrawerTaskLike): SurfaceDrawerTaskLike {
  return { id: 't1', title: 'Flyer request', ...partial };
}

describe('Surface drawer lock #2 — helper unit', () => {
  it('never uses Address Pending as Mode A H1', () => {
    expect(isPlaceholderDrawerAddress('Address Pending')).toBe(true);
    expect(isPlaceholderDrawerAddress('123 Main St, Wilmington NC')).toBe(false);
    const h1 = resolveSurfaceDrawerH1(
      task({
        status: 'triage',
        propertyAddress: 'Address Pending',
        packageType: 'Double-sided flyer',
        title: 'Address Pending',
      })
    );
    expect(h1.toLowerCase()).not.toContain('address pending');
    expect(h1).toBe('Double-sided flyer');
  });

  it('Mode A: triage / low confidence / routingReasons → A_triage', () => {
    expect(resolveSurfaceDrawerShell(task({ status: 'triage' }))).toBe('A_triage');
    expect(
      resolveSurfaceDrawerShell(task({ routingState: 'triage_required' }))
    ).toBe('A_triage');
    expect(
      resolveSurfaceDrawerShell(
        task({
          status: 'in_progress',
          routingReasons: ['LOW_CLASSIFICATION_CONFIDENCE'],
        })
      )
    ).toBe('A_triage');
    expect(
      resolveSurfaceDrawerShell(task({ classificationConfidence: 0.4 }))
    ).toBe('A_triage');
    expect(isSurfaceDrawerTriageTask(task({ status: 'triage' }))).toBe(true);
  });

  it('Mode A body is plain copy — never leaks LOW_CLASSIFICATION_CONFIDENCE', () => {
    const body = resolveSurfaceDrawerTriageBody(
      task({
        triageReason: 'LOW_CLASSIFICATION_CONFIDENCE: ambiguous channel',
        routingReasons: ['LOW_CLASSIFICATION_CONFIDENCE'],
      })
    );
    expect(body).toBe(SURFACE_DRAWER_TRIAGE_BODY);
    expect(body).not.toMatch(/LOW_CLASSIFICATION/i);
    expect(sanitizeTriageReasonForDisplay('LOW_CLASSIFICATION_CONFIDENCE')).toBe(
      SURFACE_DRAWER_TRIAGE_BODY
    );
    expect(SURFACE_DRAWER_NEEDS_TRIAGE_CHIP).toBe('Needs triage');
    expect(SURFACE_DRAWER_CONFIRM_ROUTING_LABEL).toBe('Confirm routing');
  });

  it('Mode A gates hide Approve/Upload/Maps/Workstation/email/pager', () => {
    const g = resolveSurfaceDrawerGates({
      shell: 'A_triage',
      pagerIndex: 0,
      pagerTotal: 5,
    });
    expect(g.showPager).toBe(false);
    expect(g.showUpload).toBe(false);
    expect(g.showMaps).toBe(false);
    expect(g.showWorkstationTabs).toBe(false);
    expect(g.showApproveNotify).toBe(false);
    expect(g.showEmailFooter).toBe(false);
    expect(g.showBriefAndCopy).toBe(false);
    expect(g.showDealRiskShell).toBe(false);
  });

  it('Mode B H1 = address; lane chip + deliverable; pager only when index in range', () => {
    const t = task({
      propertyAddress: '742 Lumina Ave, Wrightsville Beach, NC',
      packageType: 'Luxury Collateral',
      status: 'in_progress',
      category: 'marketing_collateral',
    });
    expect(resolveSurfaceDrawerShell(t)).toBe('B1_creative');
    expect(resolveSurfaceDrawerH1(t)).toBe('742 Lumina Ave, Wrightsville Beach, NC');
    expect(resolveSurfaceDrawerLaneChip(t)).toMatch(/Marketing|Listing|Offer/);
    const ok = resolveSurfaceDrawerGates({
      shell: 'B1_creative',
      pagerIndex: 0,
      pagerTotal: 3,
      task: t,
    });
    expect(ok.showPager).toBe(true);
    const bad = resolveSurfaceDrawerGates({
      shell: 'B1_creative',
      pagerIndex: 3,
      pagerTotal: 3,
      task: t,
    });
    expect(bad.showPager).toBe(false);
    const solo = resolveSurfaceDrawerGates({
      shell: 'B1_creative',
      pagerIndex: 0,
      pagerTotal: 1,
      task: t,
    });
    expect(solo.showPager).toBe(false);
  });

  it('B1 chase photos hides Upload + Approve/Send competing primaries', () => {
    const t = task({
      propertyAddress: '100 Main St',
      title: 'Chase photos from agent',
      missingFacts: ['photos_needed'],
      status: 'in_progress',
      category: 'marketing',
    });
    expect(isChasePhotosNext(t)).toBe(true);
    const next = resolveSurfaceDrawerNext(t, 'B1_creative');
    expect(next.verb).toBe('Chase photos');
    const g = resolveSurfaceDrawerGates({
      shell: 'B1_creative',
      pagerIndex: 0,
      pagerTotal: 2,
      task: t,
      nextVerb: next.verb,
    });
    expect(g.showUpload).toBe(false);
    expect(g.showApproveNotify).toBe(false);
    expect(g.showEmailFooter).toBe(false);
    expect(g.showBriefAndCopy).toBe(true);
  });

  it('B2 deal risk: Unblock primary; no brief/copy/headline; hide CAPS dump', () => {
    // Shell resolver uses getDealTriageFromTask — seed nested dealTriage
    const t = task({
      propertyAddress: '55 Deal Risk Ln',
      status: 'in_progress',
      dealTriage: {
        kinds: ['inspection'],
        playbookTitle: 'NEST PLAYBOOK DUMP SHOULD STAY HIDDEN',
        playbookExcerpt: 'Pause client messaging.',
        severity: 'high',
        humanOnly: true,
        clientOutboundBlocked: true,
        createdAt: '2026-09-24T12:00:00Z',
      },
    });
    expect(resolveSurfaceDrawerShell(t)).toBe('B2_deal_risk');
    expect(resolveSurfaceDrawerLaneChip(t)).toBe('Deal risk');
    const next = resolveSurfaceDrawerNext(t, 'B2_deal_risk');
    expect(next.verb).toBe('Unblock');
    const g = resolveSurfaceDrawerGates({
      shell: 'B2_deal_risk',
      pagerIndex: 0,
      pagerTotal: 2,
      task: t,
    });
    expect(g.showDealRiskShell).toBe(true);
    expect(g.showBriefAndCopy).toBe(false);
    expect(g.showHeadlineRemarksCopy).toBe(false);
    expect(g.hideCapsPlaybookDump).toBe(true);
    expect(g.showUpload).toBe(false);
    expect(g.showApproveNotify).toBe(false);
  });

  it('B3 ops mirrors B2 gates until dedicated template', () => {
    const t = task({
      propertyAddress: '9 Ops Way',
      status: 'in_progress',
      category: 'signage',
      title: 'Yard sign install',
    });
    expect(resolveSurfaceDrawerShell(t)).toBe('B3_ops');
    const g = resolveSurfaceDrawerGates({
      shell: 'B3_ops',
      pagerIndex: 0,
      pagerTotal: 2,
      task: t,
    });
    expect(g.showDealRiskShell).toBe(true);
    expect(g.showBriefAndCopy).toBe(false);
    expect(g.hideCapsPlaybookDump).toBe(true);
  });

  it('deliverable title prefers packageType over placeholder address titles', () => {
    expect(
      resolveSurfaceDrawerDeliverableTitle(
        task({ title: 'Address Pending', packageType: 'Social carousel' })
      )
    ).toBe('Social carousel');
  });
});

describe('Surface drawer lock #2 — WorkspaceTaskDrawer source wiring', () => {
  it('imports surfaceDrawerLock2 helpers', () => {
    expect(drawerSrc).toMatch(/from ['\"]\.\.\/\.\.\/lib\/surfaceDrawerLock2['\"]/);
    expect(drawerSrc).toContain('resolveSurfaceDrawerShell');
    expect(drawerSrc).toContain('resolveSurfaceDrawerH1');
    expect(drawerSrc).toContain('resolveSurfaceDrawerGates');
    expect(drawerSrc).toContain('resolveSurfaceDrawerNext');
    expect(drawerSrc).toContain('resolveSurfaceDrawerLaneChip');
    expect(drawerSrc).toContain('resolveSurfaceDrawerTriageBody');
  });

  it('Mode A: H1 from helper; Needs triage chip; plain triage body; Confirm routing', () => {
    expect(drawerSrc).toContain('resolveSurfaceDrawerH1');
    expect(drawerSrc).toContain('SURFACE_DRAWER_NEEDS_TRIAGE_CHIP');
    expect(drawerSrc).toContain('resolveSurfaceDrawerTriageBody');
    expect(drawerSrc).toContain('SURFACE_DRAWER_CONFIRM_ROUTING_LABEL');
    // Must not render raw reason codes as body
    expect(drawerSrc).not.toMatch(
      /triageReason \|\| \(activeTask\.routingReasons && activeTask\.routingReasons\.join/
    );
  });

  it('gates pager / upload / maps / workstation / approve / brief via surfaceGates', () => {
    expect(drawerSrc).toContain('surfaceGates.showPager');
    expect(drawerSrc).toContain('surfaceGates.showUpload');
    expect(drawerSrc).toContain('surfaceGates.showMaps');
    expect(drawerSrc).toContain('surfaceGates.showWorkstationTabs');
    expect(drawerSrc).toContain('surfaceGates.showApproveNotify');
    expect(drawerSrc).toContain('surfaceGates.showBriefAndCopy');
    expect(drawerSrc).toContain('surfaceGates.showDealRiskShell');
    expect(drawerSrc).toContain('surfaceGates.hideCapsPlaybookDump');
  });

  it('B2 shell exposes What / Blocker / Decide — no CAPS playbook dump when gated', () => {
    expect(drawerSrc).toContain('data-testid="deal-risk-shell"');
    expect(drawerSrc).toMatch(/What/);
    expect(drawerSrc).toMatch(/Blocker/);
    expect(drawerSrc).toMatch(/Decide/);
    // Playbook title dump must be behind hideCapsPlaybookDump
    expect(drawerSrc).toMatch(/hideCapsPlaybookDump/);
  });

  it('Next sentence + footer verb share resolveSurfaceDrawerNext', () => {
    expect(drawerSrc).toContain('surfaceNext.sentence');
    expect(drawerSrc).toContain('surfaceNext.verb');
    expect(drawerSrc).toContain('data-testid="surface-drawer-next"');
  });

  it('helper module documents Mode A + Mode B shells', () => {
    expect(helperSrc).toContain('A_triage');
    expect(helperSrc).toContain('B1_creative');
    expect(helperSrc).toContain('B2_deal_risk');
    expect(helperSrc).toContain('B3_ops');
  });
});
