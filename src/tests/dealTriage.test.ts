import { describe, it, expect } from 'vitest';
import {
  detectCollapseSignals,
  buildDealTriageAlert,
  shouldBlockClientOutbound,
  formatDealTriageBoardBadge,
} from '../lib/dealTriage';

describe('dealTriage', () => {
  it('detects inspection / appraisal / financing / title collapse signals', () => {
    expect(detectCollapseSignals('buyer failed inspection and wants out')).toContain('inspection');
    expect(detectCollapseSignals('appraisal came in low vs contract')).toContain('appraisal');
    expect(detectCollapseSignals('financing fell through at underwriting')).toContain('financing');
    expect(detectCollapseSignals('title defect on the commitment')).toContain('title');
  });

  it('builds high-severity human-only alert with playbook and client outbound blocked', () => {
    const alert = buildDealTriageAlert({
      text: 'Low appraisal and financing contingency at risk for 119 Ogilby',
      propertyAddress: '119 Ogilby Rd',
      agentName: 'Marcus Aman',
    });
    expect(alert).not.toBeNull();
    expect(alert!.severity).toBe('high');
    expect(alert!.humanOnly).toBe(true);
    expect(alert!.clientOutboundBlocked).toBe(true);
    expect(alert!.kinds.length).toBeGreaterThanOrEqual(1);
    expect(alert!.playbookTitle.length).toBeGreaterThan(5);
    expect(alert!.cite?.source).toMatch(/kb|nest_playbook_fallback/);
    expect(formatDealTriageBoardBadge(alert!)).toMatch(/Deal risk:/);
  });

  it('does not block marketing tasks without deal triage', () => {
    expect(
      shouldBlockClientOutbound({
        category: 'marketing',
        routingSnapshot: { triage: 'creative_request_v1' },
      })
    ).toBe(false);
  });

  it('blocks client outbound when deal triage snapshot present', () => {
    const alert = buildDealTriageAlert({ text: 'title cloud found' })!;
    expect(
      shouldBlockClientOutbound({
        category: 'offer_2t',
        routingSnapshot: { dealTriage: alert, clientOutboundBlocked: true },
      })
    ).toBe(true);
  });
});
