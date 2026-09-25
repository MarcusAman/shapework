import { describe, expect, it } from 'vitest';
import { applicableMarketingProofDraft } from './marketingProofDraft';

describe('restoring only an unconsumed proof draft', () => {
  const draft = { proofUrl: '', notes: 'Draft', assets: [], savedAt: '2026-09-25T12:00:00Z', baseProofUrl: '', baseProofVersion: 0 };
  const task = { proofVersion: 0, proofUrl: '', routingSnapshot: { proofDraft: draft } };
  it('restores a saved draft with the same base proof', () => { expect(applicableMarketingProofDraft(task)).toBe(draft); });
  it('does not restore a draft over a newer submitted proof', () => {
    expect(applicableMarketingProofDraft({ ...task, proofVersion: 1, proofUrl: '/uploads/new.png' })).toBeNull();
  });
  it('does not restore a draft after explicit approval of the same proof', () => {
    expect(applicableMarketingProofDraft({ ...task, reviewHistory: [{ action: 'approved', timestamp: '2026-09-25T12:01:00Z' }] })).toBeNull();
  });
});
