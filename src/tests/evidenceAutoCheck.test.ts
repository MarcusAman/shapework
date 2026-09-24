import { describe, expect, it } from 'vitest';
import {
  detectPackageKind,
  runEvidenceAutoCheck,
  requirementStatusFromEvidence,
} from '../lib/evidenceAutoCheck';

describe('evidenceAutoCheck', () => {
  it('detects listing vs offer packages', () => {
    expect(detectPackageKind({ sopId: 'sop_listing_launch_001' })).toBe('listing_launch');
    expect(detectPackageKind({ title: 'Offer / 2-T: 119 Ogilby' })).toBe('offer_2t');
  });

  it('fails when no assets', () => {
    const r = runEvidenceAutoCheck({
      task: { sopId: 'sop_listing_launch_001' },
      assets: [],
    });
    expect(r.autoApproved).toBe(false);
    expect(r.failCount).toBeGreaterThan(0);
  });

  it('passes Form 101 when filename matches', () => {
    const r = runEvidenceAutoCheck({
      task: { category: 'listing_launch' },
      assets: [{ fileName: 'Form-101-Exclusive-Right.pdf', mimeType: 'application/pdf' }],
    });
    const form101 = r.items.find((i) => i.id === 'form_101');
    expect(form101?.status).toBe('pass');
    expect(r.autoApproved).toBe(false);
  });

  it('never maps pass to verified (human still confirms)', () => {
    expect(requirementStatusFromEvidence('pass')).toBe('not_reviewed');
    expect(requirementStatusFromEvidence('fail')).toBe('needs_correction');
  });
});
