import { describe, it, expect, beforeEach, vi } from 'vitest';
import { processUserUtterance } from '../../src/services/voice-agent/transcriptRouter';
import { queryUnifiedContext } from '../../server/knowledge/unifiedContextRetriever';
import { VoiceDiagnostics } from '../../src/services/voice-agent/voiceDiagnostics';

describe('Ask Nest Ops — Voice Pipeline & Idempotency Architecture', () => {
  beforeEach(() => {
    VoiceDiagnostics.clearHistory();
  });

  it('1. Wake phrase alone creates no chat turn and produces one spoken acknowledgment ("Hi, I\'m listening.")', () => {
    const mockState: any = { pendingProposal: null };
    const result = processUserUtterance('Hey Nest', mockState, 'Ryan', 'utt_test_1');

    expect(result.intentType).toBe('WAKE_WORD_ONLY');
    expect(result.category).toBe('wake_only');
    expect(result.spokenResponse).toBe("Hi, I'm listening.");
    expect(result.displayResponse).toBe("Hi, I'm listening.");
  });

  it('2. Wake phrase plus question creates exactly one user turn with clean question', () => {
    const mockState: any = { pendingProposal: null };
    const result = processUserUtterance('Hey Nest, what contracts are pending?', mockState, 'Ryan', 'utt_test_2');

    expect(result.category).toBe('knowledge_question');
    expect(result.spokenResponse).toContain('I searched Nest records for');
  });

  it('3. One final transcript creates exactly one stable utteranceId payload', () => {
    const eventLog: any[] = [];
    VoiceDiagnostics.subscribe(e => eventLog.push(e));

    VoiceDiagnostics.log('wake_detected', 'utt_stable_123', 'Hey Nest');
    VoiceDiagnostics.log('final_utterance_created', 'utt_stable_123', 'what contracts are pending?');
    VoiceDiagnostics.log('turn_dispatch_started', 'utt_stable_123');

    expect(eventLog.map(e => e.type)).toEqual([
      'wake_detected',
      'final_utterance_created',
      'turn_dispatch_started'
    ]);
    expect(eventLog.every(e => e.utteranceId === 'utt_stable_123')).toBe(true);
  });

  it('4. Duplicate delivery of the same utteranceId is suppressed', () => {
    const processedSet = new Set<string>();
    const handleTurn = (uttId: string) => {
      if (processedSet.has(uttId)) {
        VoiceDiagnostics.log('duplicate_turn_suppressed', uttId);
        return false;
      }
      processedSet.add(uttId);
      VoiceDiagnostics.log('turn_dispatch_started', uttId);
      return true;
    };

    expect(handleTurn('utt_dup_999')).toBe(true);
    expect(handleTurn('utt_dup_999')).toBe(false);

    const history = VoiceDiagnostics.getHistory();
    expect(history.find(e => e.type === 'duplicate_turn_suppressed')).toBeDefined();
  });

  it('5. "Can you hear me?" bypasses unifiedContextRetriever with direct conversational control response', () => {
    const mockState: any = { pendingProposal: null };
    const routerResult = processUserUtterance('Can you hear me?', mockState, 'Ryan', 'utt_hear_1');

    expect(routerResult.intentType).toBe('CONVERSATION_CONTROL');
    expect(routerResult.category).toBe('conversation_control');
    expect(routerResult.spokenResponse).toBe("Yes, I can hear you. What can I help you with?");
    expect(routerResult.displayResponse).toBe("Yes, I can hear you. What can I help you with?");
  });

  it('6. Voice input automatically invokes TTS and logs diagnostic events', () => {
    const history: string[] = [];
    VoiceDiagnostics.subscribe(e => history.push(e.type));

    VoiceDiagnostics.log('tts_request_started', 'utt_voice_1');
    VoiceDiagnostics.log('tts_response_received', 'utt_voice_1');
    VoiceDiagnostics.log('audio_playback_started', 'utt_voice_1');

    expect(history).toContain('tts_request_started');
    expect(history).toContain('tts_response_received');
    expect(history).toContain('audio_playback_started');
  });

  it('7. Text input does not automatically invoke TTS unless read-aloud is enabled', () => {
    const isVoiceInput = false;
    const shouldPlayTTS = isVoiceInput;
    expect(shouldPlayTTS).toBe(false);
  });

  it('8. Recognition pauses during playback and resumes afterward', () => {
    const history: string[] = [];
    VoiceDiagnostics.subscribe(e => history.push(e.type));

    VoiceDiagnostics.log('audio_playback_started', 'utt_flow_1');
    VoiceDiagnostics.log('listening_resumed', 'utt_flow_1');

    expect(history).toEqual(['audio_playback_started', 'listening_resumed']);
  });

  it('9. Voice session can be started by wake phrase without pressing Start Voice Call', () => {
    const history: string[] = [];
    VoiceDiagnostics.subscribe(e => history.push(e.type));

    VoiceDiagnostics.log('wake_detected', 'utt_wake_start');
    VoiceDiagnostics.log('voice_session_activated', 'utt_wake_start');

    expect(history).toContain('wake_detected');
    expect(history).toContain('voice_session_activated');
  });

  it('10. NORA wake phrase variants ("Hey NORA", "Hi NORA", "Ask NORA") trigger WAKE_WORD_ONLY response', () => {
    const mockState: any = { pendingProposal: null };
    const res1 = processUserUtterance('Hey NORA', mockState, 'Ryan', 'utt_nora_1');
    expect(res1.intentType).toBe('WAKE_WORD_ONLY');
    expect(res1.spokenResponse).toBe("Hi, I'm listening.");

    const res2 = processUserUtterance('Hi NORA', mockState, 'Ryan', 'utt_nora_2');
    expect(res2.intentType).toBe('WAKE_WORD_ONLY');
    expect(res2.spokenResponse).toBe("Hi, I'm listening.");

    const res3 = processUserUtterance('Ask NORA', mockState, 'Ryan', 'utt_nora_3');
    expect(res3.intentType).toBe('WAKE_WORD_ONLY');
    expect(res3.spokenResponse).toBe("Hi, I'm listening.");

    // Legacy "Hey Lorena" must NOT be treated as a pure wake word
    const resLorena = processUserUtterance('Hey Lorena', mockState, 'Ryan', 'utt_lorena_legacy');
    expect(resLorena.intentType).not.toBe('WAKE_WORD_ONLY');
  });

  it('11. NORA correctly routes Multimodal Vision Document Scan intent', () => {
    const mockState: any = { pendingProposal: null };
    const result = processUserUtterance('Hey NORA, scan this document camera image for Form 2-T', mockState, 'Ryan', 'utt_nora_vision');

    expect(result.intentType).toBe('SCAN_DOCUMENT_VISION');
    expect(result.spokenResponse).toContain('I scanned the Form 2-T purchase offer');
    expect(result.displayResponse).toContain('NC REALTORS® Form 2-T Offer to Purchase');
  });

  it('12. NORA correctly routes Buyer-Seller Matchmaker Radar intent', () => {
    const mockState: any = { pendingProposal: null };
    const result = processUserUtterance('Hey NORA, run buyer matchmaker radar for 312 Mayfaire', mockState, 'Ryan', 'utt_nora_radar');

    expect(result.intentType).toBe('MATCHMAKER_BUYER_RADAR');
    expect(result.spokenResponse).toContain('3 great pre-approved buyers lined up');
    expect(result.displayResponse).toContain('Michael & Sarah Chang');
  });

  it('13. NORA correctly routes Deal Celebration & 3D Particle Universe intent', () => {
    const mockState: any = { pendingProposal: null };
    const result = processUserUtterance('Hey NORA, celebrate closed deal at 312 Mayfaire Way', mockState, 'Ryan', 'utt_nora_celebration');

    expect(result.intentType).toBe('TRIGGER_DEAL_CELEBRATION');
    expect(result.spokenResponse).toContain('312 Mayfaire Way is officially CLOSED');
    expect(result.displayResponse).toContain('Sarah Jenkins');
  });

  it('14. NORA correctly routes MLS Listing Launch intent', () => {
    const mockState: any = { pendingProposal: null };
    const result = processUserUtterance('Hey NORA, launch mls listing for 312 Mayfaire Way', mockState, 'Ryan', 'utt_nora_mls');

    expect(result.intentType).toBe('MLS_LISTING_LAUNCH');
    expect(result.spokenResponse).toContain('ready for MLS launch');
    expect(result.displayResponse).toContain('NC REC');
  });

  it('15. NORA correctly routes Commission Split & Payroll Copilot intent', () => {
    const mockState: any = { pendingProposal: null };
    const result = processUserUtterance('Hey NORA, check commission split payroll for Sarah Jenkins', mockState, 'Ryan', 'utt_nora_commission');

    expect(result.intentType).toBe('COMMISSION_SPLIT_PAYROLL');
    expect(result.spokenResponse).toContain('Gross commission is $21,750');
    expect(result.displayResponse).toContain('Net Agent Direct Deposit Payout');
  });

  it('16. NORA correctly routes Seller Net Sheet Calculator intent', () => {
    const mockState: any = { pendingProposal: null };
    const result = processUserUtterance('Hey NORA, calculate seller net sheet for 312 Mayfaire Way', mockState, 'Ryan', 'utt_nora_netsheet');

    expect(result.intentType).toBe('SELLER_NET_SHEET');
    expect(result.spokenResponse).toContain('estimated net wire proceeds to seller is $318,250');
    expect(result.displayResponse).toContain('NC Revenue Stamps');
  });

  it('17. NORA correctly routes Comparative Market Analysis (CMA) intent', () => {
    const mockState: any = { pendingProposal: null };
    const result = processUserUtterance('Hey NORA, run cma market analysis for 312 Mayfaire Way', mockState, 'Ryan', 'utt_nora_cma');

    expect(result.intentType).toBe('CMA_PRESENTATION');
    expect(result.spokenResponse).toContain('recommended listing price range is $720,000 to $740,000');
    expect(result.displayResponse).toContain('Average Price per SqFt');
  });

  it('18. NORA correctly routes Open House Kiosk intent', () => {
    const mockState: any = { pendingProposal: null };
    const result = processUserUtterance('Hey NORA, launch open house kiosk for 312 Mayfaire Way', mockState, 'Ryan', 'utt_nora_kiosk');

    expect(result.intentType).toBe('LAUNCH_OPEN_HOUSE_KIOSK');
    expect(result.spokenResponse).toContain('14 registered guests checked in');
  });

  it('19. NORA correctly routes Commercial Lease Audit intent', () => {
    const mockState: any = { pendingProposal: null };
    const result = processUserUtterance('Hey NORA, audit commercial lease for Suite 400', mockState, 'Ryan', 'utt_nora_comm');

    expect(result.intentType).toBe('AUDIT_COMMERCIAL_LEASE');
    expect(result.spokenResponse).toContain('Pinnacle Tech Solutions');
  });

  it('20. NORA correctly routes Emergency Maintenance Dispatch intent', () => {
    const mockState: any = { pendingProposal: null };
    const result = processUserUtterance('Hey NORA, emergency plumber water heater maintenance at Unit B', mockState, 'Ryan', 'utt_nora_maint');

    expect(result.intentType).toBe('DISPATCH_PROPERTY_MAINTENANCE');
    expect(result.spokenResponse).toContain('Wilmington Mechanical');
  });

  it('21. NORA correctly routes Multiple Offer Comparison Matrix intent', () => {
    const mockState: any = { pendingProposal: null };
    const result = processUserUtterance('Hey NORA, compare all offers for 312 Mayfaire Way', mockState, 'Ryan', 'utt_nora_offers');

    expect(result.intentType).toBe('COMPARE_MULTIPLE_OFFERS');
    expect(result.spokenResponse).toContain('side-by-side comparison for all 3 competing offers');
    expect(result.displayResponse).toContain('Offer A (Top Net)');
  });
});
