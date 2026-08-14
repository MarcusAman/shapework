/// <reference types="vitest" />
import { describe, it, expect } from 'vitest';
import { resolveSopOpening, getCleanFirstName, formatQuestionText, SopVoicePersonalization } from '../src/utils/sopOpeningResolver';
import { calculateSopDraftProgress } from '../src/utils/sopDraftProgress';

describe('SOP Opening Resolver & Personalization Utilities', () => {
  it('resolves clean first names correctly', () => {
    expect(getCleanFirstName('Melissa Gagliardi')).toBe('Melissa');
    expect(getCleanFirstName('Ryan Crecelius')).toBe('Ryan');
    expect(getCleanFirstName('ann@nestrealty.com')).toBe('');
    expect(getCleanFirstName('user@nestrealty.com')).toBe('');
    expect(getCleanFirstName('admin')).toBe('');
    expect(getCleanFirstName('')).toBe('');
    expect(getCleanFirstName(null)).toBe('');
  });

  it('formats question text with natural sentence casing & punctuation', () => {
    expect(formatQuestionText('Is seller digital signature required before payout?')).toBe('is seller digital signature required before payout?');
    expect(formatQuestionText('what happens when closing DA is delayed')).toBe('what happens when closing DA is delayed?');
    expect(formatQuestionText('SOP verification step')).toBe('SOP verification step?');
  });

  it('resolves new draft opening for Ryan (blank draft)', () => {
    const ctx: SopVoicePersonalization = {
      first_name: 'Ryan',
      full_name: 'Ryan Crecelius',
      role_title: 'owner',
      process_name: '',
      has_existing_draft: false,
      first_open_question: '',
      next_incomplete_section: 'title'
    };

    const res = resolveSopOpening(ctx);
    expect(res.openingMode).toBe('new_draft');
    expect(res.message).toContain('Hi, Ryan.');
    expect(res.message).toContain('To get started, what process would you like to document today?');
    expect(res.message).not.toContain('How can I help you today?');
  });

  it('resolves existing draft opening with open question for Melissa', () => {
    const ctx: SopVoicePersonalization = {
      first_name: 'Melissa',
      full_name: 'Melissa Gagliardi',
      role_title: 'marketing_coordinator',
      process_name: 'Commission DA Verification & Escrow Audit Procedure',
      has_existing_draft: true,
      first_open_question: 'Is seller digital signature required before payout?',
      next_incomplete_section: ''
    };

    const res = resolveSopOpening(ctx);
    expect(res.openingMode).toBe('existing_open_question');
    expect(res.message).toContain('Hi, Melissa.');
    expect(res.message).toContain('Commission DA Verification & Escrow Audit Procedure');
    expect(res.message).toContain('First, is seller digital signature required before payout?');
    expect(res.message).not.toContain('First, Is seller');
  });

  it('resolves missing-name fallback user to "Hi there."', () => {
    const ctx: SopVoicePersonalization = {
      first_name: 'user@nestrealty.com',
      full_name: 'user@nestrealty.com',
      role_title: 'admin',
      process_name: '',
      has_existing_draft: false,
      first_open_question: '',
      next_incomplete_section: 'title'
    };

    const res = resolveSopOpening(ctx);
    expect(res.openingMode).toBe('new_draft');
    expect(res.message).toContain('Hi there.');
    expect(res.message).not.toContain('Hi, there.');
    expect(res.message).not.toContain('Hi undefined');
    expect(res.message).not.toContain('Hi null');
    expect(res.message).not.toContain('Hi user');
  });

  it('calculates progress accurately without throwing undefined errors', () => {
    const p1 = calculateSopDraftProgress(null);
    expect(p1.label).toBe('Getting started');
    expect(p1.percent).toBe(0);

    const p2 = calculateSopDraftProgress({
      id: 'sop_1',
      title: 'DA Audit',
      purpose: 'Verification',
      processOwner: 'Ann Gunn',
      orderedSteps: [{ id: 's1', stepNumber: 1, action: 'Step 1' }],
      openQuestions: []
    } as any);

    expect(p2.label).toBe('Ready to review');
    expect(p2.percent).toBe(100);
  });
});
