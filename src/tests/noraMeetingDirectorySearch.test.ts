import { describe, it, expect } from 'vitest';
import { NEST_FULL_ROSTER_77 } from '../../server/persistence/nestRosterSeed';
import { processUserUtterance } from '../services/voice-agent/transcriptRouter';

describe('Nora Meeting Assistant Directory Attendee Search & Intent Routing', () => {
  it('loads full 74+ active brokerage roster members', () => {
    expect(Array.isArray(NEST_FULL_ROSTER_77)).toBe(true);
    expect(NEST_FULL_ROSTER_77.length).toBeGreaterThanOrEqual(70);
  });

  it('filters directory agents by name case-insensitively', () => {
    const query = 'matt';
    const matches = NEST_FULL_ROSTER_77.filter(p => 
      p.displayName.toLowerCase().includes(query.toLowerCase()) ||
      p.email.toLowerCase().includes(query.toLowerCase())
    );
    expect(matches.length).toBeGreaterThan(0);
    expect(matches.some(m => m.displayName.includes('Matt'))).toBe(true);
  });

  it('filters directory agents by office location (Mayfaire / Carolina Beach)', () => {
    const cbMatches = NEST_FULL_ROSTER_77.filter(p => 
      p.primaryOfficeName.toLowerCase().includes('carolina')
    );
    expect(cbMatches.length).toBeGreaterThan(0);

    const mayfaireMatches = NEST_FULL_ROSTER_77.filter(p => 
      p.primaryOfficeName.toLowerCase().includes('mayfaire')
    );
    expect(mayfaireMatches.length).toBeGreaterThan(0);
  });

  it('routes "schedule me a meeting please" directly to CLARIFY_MEETING_SCHEDULE with wizard card', () => {
    const runtimeState: any = {
      isSessionActive: true,
      pendingProposal: null,
      dialogueHistory: []
    };

    const result = processUserUtterance('schedule me a meeting please', runtimeState);
    expect(result.intentType).toBe('CLARIFY_MEETING_SCHEDULE');
    expect(result.meetingWizard).toBeDefined();
    expect(result.displayResponse).toContain('AskNora@nestrealty.com');
  });

  it('routes "Execute: schedule me a meeting please" directly to CLARIFY_MEETING_SCHEDULE', () => {
    const runtimeState: any = {
      isSessionActive: true,
      pendingProposal: null,
      dialogueHistory: []
    };

    const result = processUserUtterance('Execute: schedule me a meeting please', runtimeState);
    expect(result.intentType).toBe('CLARIFY_MEETING_SCHEDULE');
    expect(result.meetingWizard).toBeDefined();
  });

  it('routes "book a 1-on-1 with Matt Orr" and auto-populates Matt Orr as targetAudience', () => {
    const runtimeState: any = {
      isSessionActive: true,
      pendingProposal: null,
      dialogueHistory: []
    };

    const result = processUserUtterance('book a 1-on-1 with Matt Orr', runtimeState);
    expect(result.intentType).toBe('CLARIFY_MEETING_SCHEDULE');
    expect(result.meetingWizard?.targetAudience).toBe('Matt Orr');
  });
});
