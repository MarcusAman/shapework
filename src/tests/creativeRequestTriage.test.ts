import { describe, it, expect } from 'vitest';
import {
  buildCreativeBrief,
  buildCreativeTaskDraft,
  canSendCreativeOutbound,
  creativeOutboundBlockReason,
  deriveMaxaBoardStatus,
  detectCreativeDeliverables,
  formatMaxaBoardStatus,
} from '../lib/creativeRequestTriage';

describe('creativeRequestTriage', () => {
  it('detects flyer + social from free text', () => {
    const kinds = detectCreativeDeliverables('Need a flyer and Instagram story for 119 Ogilby');
    expect(kinds).toContain('flyer');
    expect(kinds).toContain('social_story');
  });

  it('builds Melissa→Eduardo marketing draft with structured brief', () => {
    const draft = buildCreativeTaskDraft({
      source: 'ask_nora',
      text: 'Just listed flyer + postcard for 312 Mayfaire Way',
      propertyAddress: '312 Mayfaire Way, Wilmington NC',
      agentName: 'Marcus Aman',
    });
    expect(draft.category).toBe('marketing');
    expect(draft.status).toBe('request_received');
    expect(draft.assignedTo).toBe('Melissa Gagliardi');
    expect(draft.fulfillmentStaffName).toBe('Eduardo Lovo');
    expect(draft.creativeBrief.deliverables).toEqual(
      expect.arrayContaining(['flyer', 'postcard'])
    );
    expect(draft.routingSnapshot.outboundUntilComplete).toBe(true);
    expect(draft.notes).toContain('CREATIVE BRIEF');
  });

  it('derives maxa board status from task signals', () => {
    expect(deriveMaxaBoardStatus({ status: 'request_received' })).toBe('not_started');
    const brief = buildCreativeBrief({
      source: 'email',
      text: 'flyer please',
      propertyAddress: '1 Main',
    });
    expect(
      deriveMaxaBoardStatus({
        status: 'request_received',
        creativeBrief: brief,
        category: 'marketing',
      })
    ).toBe('brief_ready');
    expect(deriveMaxaBoardStatus({ status: 'with_vendor', category: 'marketing' })).toBe('in_maxa');
    expect(
      deriveMaxaBoardStatus({ status: 'in_progress', proofUrl: 'https://example.com/p.pdf', category: 'print' })
    ).toBe('proof_staged');
    expect(deriveMaxaBoardStatus({ status: 'revisions', category: 'marketing' })).toBe('needs_revision');
    expect(deriveMaxaBoardStatus({ status: 'agent_review', category: 'marketing' })).toBe('awaiting_review');
    expect(deriveMaxaBoardStatus({ status: 'approved', proofUrl: '/x.pdf', category: 'marketing' })).toBe(
      'complete'
    );
    expect(formatMaxaBoardStatus('brief_ready')).toMatch(/brief ready/i);
  });

  it('blocks outbound until creative task is complete with proof', () => {
    const brief = buildCreativeBrief({ source: 'ask_nora', text: 'flyer' });
    const open = {
      status: 'in_progress' as const,
      category: 'marketing',
      creativeBrief: brief,
    };
    expect(canSendCreativeOutbound(open)).toBe(false);
    expect(creativeOutboundBlockReason(open)).toMatch(/No outbound until/i);

    const done = {
      status: 'approved' as const,
      category: 'marketing',
      creativeBrief: brief,
      proofUrl: 'https://nest.maxadesigns.com/proof/1',
    };
    expect(canSendCreativeOutbound(done)).toBe(true);
    expect(creativeOutboundBlockReason(done)).toBeNull();
  });

  it('does not invent deliverables beyond text signals (defaults flyer only)', () => {
    const brief = buildCreativeBrief({ source: 'manual', text: 'please help with listing look' });
    expect(brief.deliverables).toEqual(['flyer']);
  });
});
