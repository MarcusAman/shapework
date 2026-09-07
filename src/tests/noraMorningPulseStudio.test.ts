import { describe, it, expect } from 'vitest';
import { NoraMorningPulseService } from '../../server/services/noraMorningPulseService';

describe('Nora Morning Pulse & Daily Inspiration Suite', () => {
  it('1. Generates complete Morning Pulse with MLS stats, quote, and voice briefing', () => {
    const pulse = NoraMorningPulseService.getDailyMorningPulse('2026-08-31');

    expect(pulse).toBeDefined();
    expect(pulse.date).toBe('2026-08-31');
    expect(pulse.inspirationalSpark.quote).toBeDefined();
    expect(pulse.inspirationalSpark.author).toBeDefined();
    expect(pulse.inspirationalSpark.actionChallenge).toBeDefined();
    expect(pulse.marketPulse.medianSoldPrice).toBe('$435,000');
    expect(pulse.marketPulse.newListings24h).toBe(12);
    expect(pulse.audioBriefing.transcript).toContain('Good morning Nest Realty');
    expect(pulse.activeAgentCount).toBe(77);
  });

  it('2. Dispatches 1-click morning pulse broadcast to all 77 brokers', () => {
    const broadcast = NoraMorningPulseService.broadcastMorningPulse({ channel: 'both' });
    expect(broadcast.success).toBe(true);
    expect(broadcast.recipientCount).toBe(77);
    expect(broadcast.dispatchId).toContain('broadcast_pulse_');
  });
});
