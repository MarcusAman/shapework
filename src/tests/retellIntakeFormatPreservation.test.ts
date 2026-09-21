import { describe, it, expect } from 'vitest';
import {
  normalizeMarketingDeliverables,
  NoraMarketingIntakeOrchestrator
} from '../../server/services/noraMarketingIntakeOrchestrator.js';

describe('Retell Marketing Intake Format Preservation & Clarification', () => {
  const orchestrator = new NoraMarketingIntakeOrchestrator();

  it('preserves explicit tri-fold flyer format and strips default (Front & Back)', () => {
    const rawDeliverables = ['Open House Flyer (Front & Back)'];
    const notes = 'Caller requested a tri-fold flyer for the open house on Sunday';
    const transcript = 'Hi Nora, I need an open house flyer, make it a trifold, 50 copies.';

    const result = normalizeMarketingDeliverables(rawDeliverables, notes, transcript);

    expect(result.deliverables).toEqual(['Open House Tri-Fold Flyer']);
    expect(result.needsClarification).toBe(false);
  });

  it('corrects speech recognition phonetic artifact ("threshold") to Tri-Fold Flyer', () => {
    const rawDeliverables = ['Open House Flyer (Front & Back)'];
    const notes = 'Speech recognized: open house flyer threshold 50 copies';
    const transcript = 'Could we get threshold flyers for 1104 Live Oak?';

    const result = normalizeMarketingDeliverables(rawDeliverables, notes, transcript);

    expect(result.deliverables).toEqual(['Open House Tri-Fold Flyer']);
    expect(result.needsClarification).toBe(false);
  });

  it('preserves explicit Single-Page Flyer when requested', () => {
    const rawDeliverables = ['Flyer'];
    const notes = 'Needs single-page flyer printed';

    const result = normalizeMarketingDeliverables(rawDeliverables, notes);

    expect(result.deliverables).toEqual(['Single-Page Flyer']);
    expect(result.needsClarification).toBe(false);
  });

  it('preserves explicit Double-Sided Property Flyer when requested', () => {
    const rawDeliverables = ['Double-Sided Property Flyer'];
    const notes = 'Agent wants front and back 2-page printout';

    const result = normalizeMarketingDeliverables(rawDeliverables, notes);

    expect(result.deliverables).toEqual(['Double-Sided Property Flyer']);
    expect(result.needsClarification).toBe(false);
  });

  it('flags clarification when speech recognition leaves flyer format uncertain rather than guessing', () => {
    const rawDeliverables = ['Flyer'];
    const notes = 'Caller said they need a flyer for their listing';

    const result = normalizeMarketingDeliverables(rawDeliverables, notes);

    expect(result.needsClarification).toBe(true);
    expect(result.clarificationPrompt).toBe('Did you want that as a tri-fold flyer or a single-page flyer?');
  });

  it('executes fresh isolated intake evaluating tri-fold flyer preservation in evaluateMarketingIntake', async () => {
    const evalResult = await orchestrator.evaluateMarketingIntake({
      propertyAddress: '1104 South Live Oak Parkway, Wilmington, NC 28403',
      flexMlsStatus: 'flex_live',
      mlsNumber: '100458921',
      deliverables: ['Open House Flyer (Front & Back)'],
      notes: 'Trifold flyer 50 copies CopyCat print',
      neededByDate: '2026-09-11',
      callerName: 'Marcus Aman'
    }, {
      channel: 'phone',
      workspaceId: 'ws_wilmington',
      authSource: 'telephony_caller_id',
      requesterName: 'Marcus Aman',
      requesterEmail: 'marcus.aman@gmail.com',
      isCallerVerified: true
    });

    expect(evalResult.readinessStatus).toBe('ready_for_review');
    expect(evalResult.extractedFields.deliverables).toEqual(['Open House Tri-Fold Flyer']);
    expect(evalResult.missingFields).not.toContain('flyer_format_clarification');
  });

  it('halts with clarification prompt in evaluateMarketingIntake when flyer format is uncertain', async () => {
    const evalResult = await orchestrator.evaluateMarketingIntake({
      propertyAddress: '1104 South Live Oak Parkway, Wilmington, NC 28403',
      flexMlsStatus: 'flex_live',
      mlsNumber: '100458921',
      deliverables: ['Flyer'],
      notes: 'Caller wants a flyer',
      neededByDate: '2026-09-11',
      callerName: 'Marcus Aman'
    }, {
      channel: 'phone',
      workspaceId: 'ws_wilmington',
      authSource: 'telephony_caller_id',
      requesterName: 'Marcus Aman',
      requesterEmail: 'marcus.aman@gmail.com',
      isCallerVerified: true
    });

    expect(evalResult.readinessStatus).toBe('needs_info');
    expect(evalResult.missingFields).toContain('flyer_format_clarification');
    expect(evalResult.voiceResponse.nextQuestion).toBe('Did you want that as a tri-fold flyer or a single-page flyer?');
  });
});
