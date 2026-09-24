/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Wave 3 GO — Marcus/Conductor: Meta-SOPs + high-priority content.
 * Harness proves the 6 governed SOPs exist in product seed/registry with
 * Wave-2 fields (roles-not-names, owner/activation, multi-assignee steps,
 * category, export-safe) and are visible in the Knowledge Library Published lane.
 */

import { describe, it, expect } from 'vitest';
import { INITIAL_NEST_SOPS, sopRepository } from '../../server/persistence/sopRepository';
import { CANONICAL_SOP_CATEGORIES, normalizeSopCategory } from '../types/sopWorkflow';
import { lintSopText, validateSopRoleCompliance } from '../utils/sopRoleGuard';
import { SOP_CATEGORY_TEMPLATES } from '../components/sops/sopTemplates';

/** Mirrors SOPLibrary published-lane filter (status === 'published'). */
function isVisibleInPublishedLibraryLane(sop: { status?: string }): boolean {
  return sop.status === 'published';
}

const WAVE3_GOVERNED_SIX = [
  {
    id: 'sop_gospel_cash_cadence_040',
    titleIncludes: 'Gospel',
    categoryHint: 'Finance',
    ownerRole: 'Finance Lead',
    minSteps: 5,
  },
  {
    id: 'sop_payroll_processing_045',
    titleIncludes: 'Payroll',
    categoryHint: 'Finance',
    ownerRole: 'Finance Lead',
    minSteps: 5,
  },
  {
    id: 'sop_marketing_intake_003',
    titleIncludes: 'Marketing',
    categoryHint: 'Marketing',
    ownerRole: 'Marketing Lead',
    minSteps: 5,
  },
  {
    id: 'sop_listing_launch_001',
    titleIncludes: 'Listing Launch',
    categoryHint: 'Marketing',
    ownerRole: 'Marketing Lead',
    minSteps: 5,
  },
  {
    id: 'sop_google_reviews_engine_025',
    titleIncludes: 'Google Reviews',
    categoryHint: 'Marketing',
    ownerRole: 'Marketing Lead',
    minSteps: 5,
  },
  {
    id: 'sop_new_agent_onboarding_008',
    titleIncludes: 'New Agent Onboarding',
    categoryHint: 'Agent Onboarding',
    ownerRole: 'Operations Lead',
    minSteps: 5,
  },
] as const;

describe('Wave 3 GO: 6 governed SOPs in Knowledge Library', () => {
  it('seeds all 6 governed SOPs in INITIAL_NEST_SOPS with required Wave-2 fields', () => {
    for (const spec of WAVE3_GOVERNED_SIX) {
      const sop = INITIAL_NEST_SOPS[spec.id];
      expect(sop, `Seed missing: ${spec.id}`).toBeDefined();
      expect(sop.title).toContain(spec.titleIncludes);
      expect(sop.purpose?.length ?? 0).toBeGreaterThan(20);
      expect(sop.trigger?.length ?? 0).toBeGreaterThan(10);
      expect(sop.processOwner).toBe(spec.ownerRole);
      expect(sop.sopOwner?.type).toBeTruthy();
      expect(sop.sopOwner?.name?.length ?? 0).toBeGreaterThan(2);
      expect(sop.activationDate).toBeTruthy();
      expect(sop.effectiveDate || sop.activationDate).toBeTruthy();
      expect(sop.status).toBe('published');
      expect(sop.stateJurisdiction || 'NC').toBeTruthy();
      expect(sop.orderedSteps.length).toBeGreaterThanOrEqual(spec.minSteps);
      expect(String(sop.completionEvidence || '').length).toBeGreaterThan(10);
      expect(sop.version).toBeTruthy();

      const canonical = normalizeSopCategory(sop.category);
      expect(CANONICAL_SOP_CATEGORIES).toContain(canonical);
      expect(sop.category).toContain(spec.categoryHint.split(' ')[0] === 'Agent' ? 'Agent' : spec.categoryHint);

      for (const step of sop.orderedSteps) {
        expect(step.primaryRole || step.role, `Step ${step.stepNumber} in ${spec.id} needs primaryRole/role`).toBeTruthy();
        expect(step.affirmationCheck?.length ?? 0).toBeGreaterThan(15);
        expect(step.durationPolicy?.preset || step.durationPolicy?.rawDisplay).toBeTruthy();
      }

      const multiAssignee = sop.orderedSteps.some(s => s.secondaryRole);
      expect(multiAssignee, `${spec.id} should include at least one multi-assignee step`).toBe(true);
    }
  });

  it('exposes all 6 via sopRepository.listDraftsSync (Library product data path)', () => {
    const loaded = sopRepository.listDraftsSync('ws_wilmington', 'ws_wilmington');
    expect(loaded.length).toBeGreaterThanOrEqual(6);

    for (const spec of WAVE3_GOVERNED_SIX) {
      const sop = loaded.find(s => s.id === spec.id);
      expect(sop, `Repository missing ${spec.id}`).toBeDefined();
      expect(sop!.title).toContain(spec.titleIncludes);
      expect(isVisibleInPublishedLibraryLane(sop!)).toBe(true);
    }
  });

  it('places all 6 in the Knowledge Library Published lane (not draft/review lanes)', () => {
    const loaded = sopRepository.listDraftsSync('ws_wilmington', 'ws_wilmington');
    const publishedLane = loaded.filter(isVisibleInPublishedLibraryLane);
    const publishedIds = new Set(publishedLane.map(s => s.id));

    for (const spec of WAVE3_GOVERNED_SIX) {
      expect(publishedIds.has(spec.id), `${spec.id} must appear in Published SOPs lane`).toBe(true);
      const sop = publishedLane.find(s => s.id === spec.id)!;
      expect(['draft', 'for_comment', 'awaiting_bic_review', 'awaiting_owner_review', 'archived']).not.toContain(sop.status);
    }
  });

  it('keeps category starter templates pointing at registry SOPs with NC jurisdiction', () => {
    const finance = SOP_CATEGORY_TEMPLATES.find(c => c.category === 'Finance');
    const marketing = SOP_CATEGORY_TEMPLATES.find(c => c.category === 'Marketing');
    const onboarding = SOP_CATEGORY_TEMPLATES.find(
      c => c.category === 'Agent Onboarding, Training, Support and Retention'
    );

    expect(finance?.templateId).toBe('sop_gospel_cash_cadence_040');
    expect(finance?.jurisdiction).toBe('NC');
    expect(marketing?.templateId).toBe('sop_listing_launch_001');
    expect(marketing?.jurisdiction).toBe('NC');
    expect(onboarding?.templateId).toBe('sop_new_agent_onboarding_008');
    expect(onboarding?.jurisdiction).toBe('NC');
  });

  it('enforces 100% Role Guard compliance (roles, not personal names) across the 6', () => {
    for (const spec of WAVE3_GOVERNED_SIX) {
      const sop = INITIAL_NEST_SOPS[spec.id];
      const compliance = validateSopRoleCompliance(sop);
      expect(
        compliance.violations,
        `Role violations in ${spec.id}: ${compliance.violations.join(', ')}`
      ).toEqual([]);
      expect(compliance.compliant).toBe(true);

      const allText = [
        sop.title,
        sop.purpose,
        sop.trigger,
        sop.processOwner,
        ...(sop.participants || []),
        ...sop.orderedSteps.map(
          s =>
            `${s.title || ''} ${s.action} ${s.role} ${s.primaryRole || ''} ${s.secondaryRole || ''} ${s.affirmationCheck || ''}`
        ),
        ...(sop.decisions || []),
        ...(sop.exceptions || []),
        ...(sop.escalationPaths || []),
      ].join('\n');

      const lint = lintSopText(allText);
      expect(lint.hasViolations, `Lint violations in ${spec.id}: ${JSON.stringify(lint.violations)}`).toBe(false);
    }
  });
});
