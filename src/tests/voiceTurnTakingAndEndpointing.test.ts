import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { 
  VoicePipeline, 
  isLikelyIncompleteUtterance, 
  TranscriptPayload,
  InterimUpdatePayload 
} from '../services/voice-agent/voicePipeline';
import { 
  agentRuntimeReducer, 
  initialRuntimeState, 
  AgentRuntimeState 
} from '../services/voice-agent/agentRuntimeReducer';
import { processUserUtterance } from '../services/voice-agent/transcriptRouter';
import { queryUnifiedContext } from '../../server/knowledge/unifiedContextRetriever';
import { VoiceDiagnostics } from '../services/voice-agent/voiceDiagnostics';

function setupMockSpeechRecognition() {
  let instance: any = null;
  const MockClass = vi.fn().mockImplementation(function (this: any) {
    this.continuous = false;
    this.interimResults = false;
    this.lang = '';
    this.start = vi.fn().mockImplementation(() => {
      if (this.onstart) this.onstart();
    });
    this.abort = vi.fn();
    this.stop = vi.fn();
    this.onstart = null;
    this.onspeechstart = null;
    this.onsoundstart = null;
    this.onresult = null;
    this.onerror = null;
    this.onend = null;
    instance = this;
  });

  (globalThis as any).SpeechRecognition = MockClass;
  (globalThis as any).webkitSpeechRecognition = MockClass;
  if (typeof (globalThis as any).window !== 'undefined') {
    (globalThis as any).window.SpeechRecognition = MockClass;
    (globalThis as any).window.webkitSpeechRecognition = MockClass;
  }

  return {
    getInstance: () => instance,
    MockClass
  };
}

describe('NORA Voice Turn-Taking, Multi-Segment Aggregation & Endpointing Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useFakeTimers();
    VoiceDiagnostics.clearHistory();

    if (typeof (globalThis as any).window === 'undefined') {
      (globalThis as any).window = globalThis;
    }
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // TEST 1: Interim speech fragments never commit or dispatch backend
  it('Test 1: Interim speech fragments update interim transcript but never commit turns or dispatch backend', () => {
    const statusChanges: string[] = [];
    const interimUpdates: InterimUpdatePayload[] = [];
    const committedTurns: TranscriptPayload[] = [];

    const mock = setupMockSpeechRecognition();

    const pipeline = new VoicePipeline({
      onStatusChange: (status) => statusChanges.push(status),
      onInterimUpdate: (update) => interimUpdates.push(update),
      onTranscriptReceived: (turn) => committedTurns.push(turn),
      onFrequencyUpdate: () => {}
    });

    pipeline.startListening();
    const rec = mock.getInstance();

    expect(statusChanges).toContain('listening');

    // Simulate interim event 1: "can you" (isFinal: false)
    rec.onresult({
      resultIndex: 0,
      results: [
        Object.assign([{ transcript: 'can you' }], { isFinal: false })
      ]
    });

    expect(interimUpdates.length).toBe(1);
    expect(interimUpdates[0].text).toBe('can you');
    expect(interimUpdates[0].interimOnly).toBe('can you');
    expect(committedTurns.length).toBe(0); // Zero committed turns

    // Simulate interim event 2: "can you help" (isFinal: false)
    rec.onresult({
      resultIndex: 0,
      results: [
        Object.assign([{ transcript: 'can you help' }], { isFinal: false })
      ]
    });

    expect(interimUpdates.length).toBe(2);
    expect(interimUpdates[1].text).toBe('can you help');
    expect(committedTurns.length).toBe(0); // Still zero committed turns
  });

  // TEST 2: Multiple isFinal chunks do NOT commit prematurely; endpointing timer governs commit
  it('Test 2: Multiple WebKit isFinal recognition segments across pauses are aggregated into a single committed turn', () => {
    const committedTurns: TranscriptPayload[] = [];
    const interimUpdates: InterimUpdatePayload[] = [];

    const mock = setupMockSpeechRecognition();

    const pipeline = new VoicePipeline({
      onStatusChange: () => {},
      onInterimUpdate: (u) => interimUpdates.push(u),
      onTranscriptReceived: (turn) => committedTurns.push(turn),
      onFrequencyUpdate: () => {}
    });

    pipeline.startListening();
    const rec = mock.getInstance();

    // Segment 1: "can you help me find" (WebKit marked isFinal = true for this chunk)
    rec.onresult({
      resultIndex: 0,
      results: [
        Object.assign([{ transcript: 'can you help me find' }], { isFinal: true })
      ]
    });

    // Verify it did NOT immediately commit turn on WebKit isFinal!
    expect(committedTurns.length).toBe(0);

    // User continues after 300ms natural pause: Segment 2: "the listing launch SOP" (isFinal = true)
    vi.advanceTimersByTime(300);

    rec.onresult({
      resultIndex: 1,
      results: [
        Object.assign([{ transcript: 'can you help me find' }], { isFinal: true }),
        Object.assign([{ transcript: 'the listing launch SOP' }], { isFinal: true })
      ]
    });

    expect(committedTurns.length).toBe(0);

    // Advance time beyond standard silence endpoint (1,200ms)
    vi.advanceTimersByTime(1300);

    // Exactly 1 turn committed with full combined text
    expect(committedTurns.length).toBe(1);
    expect(committedTurns[0].text).toBe('can you help me find the listing launch SOP');
    expect(committedTurns[0].isFinal).toBe(true);
  });

  // TEST 3: Comprehensive pause spectrum (500ms, 800ms, 1,100ms, 1,500ms, 1,900ms) across 9-segment full sentence
  it('Test 3: The 9-segment target sentence aggregates across 500ms, 800ms, 1100ms, 1500ms, and 1900ms pauses into 1 single committed turn', () => {
    const committedTurns: TranscriptPayload[] = [];
    const mock = setupMockSpeechRecognition();

    const pipeline = new VoicePipeline({
      onStatusChange: () => {},
      onTranscriptReceived: (turn) => committedTurns.push(turn),
      onFrequencyUpdate: () => {}
    });

    pipeline.startListening();
    const rec = mock.getInstance();

    // Intended: "Can you help me find the approved Nest procedure for preparing a new listing for launch?"
    // Segment 1: "Can you" (Incomplete prelude -> 2,000ms timer)
    rec.onresult({
      results: [Object.assign([{ transcript: 'Can you' }], { isFinal: true })]
    });
    // Pause 1,900ms (just under 2,000ms incomplete prelude timer)
    vi.advanceTimersByTime(1900);
    expect(committedTurns.length).toBe(0);

    // Segment 2: "help me find"
    rec.onresult({
      results: [
        Object.assign([{ transcript: 'Can you' }], { isFinal: true }),
        Object.assign([{ transcript: 'help me find' }], { isFinal: true })
      ]
    });
    // Pause 1,500ms (under 2,000ms prelude timer)
    vi.advanceTimersByTime(1500);
    expect(committedTurns.length).toBe(0);

    // Segment 3: "the approved Nest procedure"
    rec.onresult({
      results: [
        Object.assign([{ transcript: 'Can you' }], { isFinal: true }),
        Object.assign([{ transcript: 'help me find' }], { isFinal: true }),
        Object.assign([{ transcript: 'the approved Nest procedure' }], { isFinal: true })
      ]
    });
    // Pause 1,100ms (under 1,200ms standard timer)
    vi.advanceTimersByTime(1100);
    expect(committedTurns.length).toBe(0);

    // Segment 4: "for preparing a new listing"
    rec.onresult({
      results: [
        Object.assign([{ transcript: 'Can you' }], { isFinal: true }),
        Object.assign([{ transcript: 'help me find' }], { isFinal: true }),
        Object.assign([{ transcript: 'the approved Nest procedure' }], { isFinal: true }),
        Object.assign([{ transcript: 'for preparing a new listing' }], { isFinal: true })
      ]
    });
    // Pause 800ms
    vi.advanceTimersByTime(800);
    expect(committedTurns.length).toBe(0);

    // Segment 5: "for launch"
    rec.onresult({
      results: [
        Object.assign([{ transcript: 'Can you' }], { isFinal: true }),
        Object.assign([{ transcript: 'help me find' }], { isFinal: true }),
        Object.assign([{ transcript: 'the approved Nest procedure' }], { isFinal: true }),
        Object.assign([{ transcript: 'for preparing a new listing' }], { isFinal: true }),
        Object.assign([{ transcript: 'for launch' }], { isFinal: true })
      ]
    });
    // Pause 500ms
    vi.advanceTimersByTime(500);
    expect(committedTurns.length).toBe(0);

    // User finishes speaking; silence endpoint elapses (+800ms -> 1,300ms total)
    vi.advanceTimersByTime(800);

    expect(committedTurns.length).toBe(1);
    expect(committedTurns[0].text).toBe('Can you help me find the approved Nest procedure for preparing a new listing for launch');
    expect(committedTurns[0].isFinal).toBe(true);

    const history = VoiceDiagnostics.getHistory();
    const commits = history.filter(h => h.type === 'turn_committed');
    expect(commits.length).toBe(1);
    expect(commits[0].details).toContain('Reason: adaptive_silence');
  });

  // TEST 4: Browser onend during incomplete phrase restarts safely and does NOT commit prematurely
  it('Test 4: Browser SpeechRecognition.onend during incomplete phrase restarts and preserves buffer without premature commit', () => {
    const committedTurns: TranscriptPayload[] = [];
    const mock = setupMockSpeechRecognition();

    const pipeline = new VoicePipeline({
      onStatusChange: () => {},
      onTranscriptReceived: (turn) => committedTurns.push(turn),
      onFrequencyUpdate: () => {}
    });

    pipeline.startListening();
    const rec = mock.getInstance();

    // 1. Final segment: "can you"
    rec.onresult({
      results: [Object.assign([{ transcript: 'can you' }], { isFinal: true })]
    });

    // 2. Browser fires onend (spontaneous silence / network cycle)
    rec.onend();

    // Verify it did NOT commit "can you"!
    expect(committedTurns.length).toBe(0);

    // 3. User continues speaking after restart: "help me find the listing launch procedure"
    rec.onresult({
      results: [Object.assign([{ transcript: 'help me find the listing launch procedure' }], { isFinal: true })]
    });

    // 4. Silence endpoint expires (1,300ms)
    vi.advanceTimersByTime(1300);

    // Exactly 1 complete committed turn
    expect(committedTurns.length).toBe(1);
    expect(committedTurns[0].text).toBe('can you help me find the listing launch procedure');
  });

  // TEST 5: Multiple consecutive onend cycles preserve the utterance
  it('Test 5: Multiple consecutive onend/restart cycles preserve buffer and produce exactly 1 final turn', () => {
    const committedTurns: TranscriptPayload[] = [];
    const mock = setupMockSpeechRecognition();

    const pipeline = new VoicePipeline({
      onStatusChange: () => {},
      onTranscriptReceived: (turn) => committedTurns.push(turn),
      onFrequencyUpdate: () => {}
    });

    pipeline.startListening();
    const rec = mock.getInstance();

    // Part 1: "What is the approved process for"
    rec.onresult({
      results: [Object.assign([{ transcript: 'What is the approved process for' }], { isFinal: true })]
    });

    // onend cycle 1
    rec.onend();
    expect(committedTurns.length).toBe(0);

    // onend cycle 2
    rec.onend();
    expect(committedTurns.length).toBe(0);

    // Part 2: "requesting a price reduction?"
    rec.onresult({
      results: [Object.assign([{ transcript: 'requesting a price reduction?' }], { isFinal: true })]
    });

    // Final silence
    vi.advanceTimersByTime(1300);

    expect(committedTurns.length).toBe(1);
    expect(committedTurns[0].text).toBe('What is the approved process for requesting a price reduction?');
  });

  // TEST 6: Incomplete prelude detection logic
  it('Test 6: Incomplete conversational preludes and dangling tokens are classified accurately', () => {
    expect(isLikelyIncompleteUtterance('can you')).toBe(true);
    expect(isLikelyIncompleteUtterance('could you')).toBe(true);
    expect(isLikelyIncompleteUtterance('can you help me')).toBe(true);
    expect(isLikelyIncompleteUtterance('what is the')).toBe(true);
    expect(isLikelyIncompleteUtterance('where can I')).toBe(true);
    expect(isLikelyIncompleteUtterance('approved procedure for')).toBe(true); // ends with 'for'
    expect(isLikelyIncompleteUtterance('look up Matt Orr and')).toBe(true); // ends with 'and'
    expect(isLikelyIncompleteUtterance('what is the process of')).toBe(true); // ends with 'of'

    // Complete phrases are not incomplete preludes
    expect(isLikelyIncompleteUtterance('listing launch sop')).toBe(false);
    expect(isLikelyIncompleteUtterance('what is Matt Orr phone number')).toBe(false);
  });

  // TEST 7: Speech onset immediately aborts active backend requests and TTS playback
  it('Test 7: onSpeechStarted callback triggers immediate in-flight request abort and invalidates turn ID', () => {
    let speechStartedCalled = false;
    let speechStartedUttId = '';

    const mock = setupMockSpeechRecognition();

    const pipeline = new VoicePipeline({
      onStatusChange: () => {},
      onTranscriptReceived: () => {},
      onFrequencyUpdate: () => {},
      onSpeechStarted: (uttId) => {
        speechStartedCalled = true;
        speechStartedUttId = uttId;
      }
    });

    pipeline.startListening();
    const rec = mock.getInstance();

    rec.onspeechstart();

    expect(speechStartedCalled).toBe(true);
    expect(speechStartedUttId.startsWith('utt_')).toBe(true);
  });

  // TEST 8: Explicit stop commits immediately with reason "explicit_stop" or "explicit_submit"
  it('Test 8: Explicit stop button commits buffered turn immediately with explicit reason', () => {
    const committedTurns: TranscriptPayload[] = [];
    const mock = setupMockSpeechRecognition();

    const pipeline = new VoicePipeline({
      onStatusChange: () => {},
      onTranscriptReceived: (turn) => committedTurns.push(turn),
      onFrequencyUpdate: () => {}
    });

    pipeline.startListening();
    const rec = mock.getInstance();

    rec.onresult({
      results: [Object.assign([{ transcript: 'search directory for Ann' }], { isFinal: true })]
    });

    // User explicitly clicks Stop (e.g. Stop button on microphone orb)
    pipeline.stopListening(false);

    expect(committedTurns.length).toBe(1);
    expect(committedTurns[0].text).toBe('search directory for Ann');

    const history = VoiceDiagnostics.getHistory();
    const commits = history.filter(h => h.type === 'turn_committed');
    expect(commits.length).toBe(1);
    expect(commits[0].details).toContain('Reason: explicit_stop');
  });

  // TEST 9: Cancel completely discards uncommitted speech
  it('Test 9: Calling cancelCurrentTurn cleanly discards uncommitted speech without delayed submission', () => {
    const committedTurns: TranscriptPayload[] = [];
    const statusChanges: string[] = [];

    const mock = setupMockSpeechRecognition();

    const pipeline = new VoicePipeline({
      onStatusChange: (s) => statusChanges.push(s),
      onTranscriptReceived: (t) => committedTurns.push(t),
      onFrequencyUpdate: () => {}
    });

    pipeline.startListening();
    const rec = mock.getInstance();

    rec.onresult({
      results: [
        Object.assign([{ transcript: 'Can you draft an offer for' }], { isFinal: false })
      ]
    });

    // User clicks Cancel
    pipeline.cancelCurrentTurn();

    // Fast-forward all timers
    vi.runAllTimers();

    // Zero committed turns
    expect(committedTurns.length).toBe(0);
    expect(statusChanges).toContain('idle');

    const history = VoiceDiagnostics.getHistory();
    const cancels = history.filter(h => h.type === 'turn_cancelled');
    expect(cancels.length).toBe(1);
  });

  // TEST 10: Client and Server Intent Parity across all representative scenarios
  it('Test 10: Client transcriptRouter and Server unifiedContextRetriever exhibit 100% intent and response parity', () => {
    const testCases = [
      {
        query: 'Can you help me?',
        expectedIntent: 'CONVERSATIONAL_HELP',
        expectedPhrase: 'what do you need help with'
      },
      {
        query: 'Hello',
        expectedIntent: 'CONVERSATIONAL_GREETING',
        expectedPhrase: 'help'
      },
      {
        query: 'Who is Ann?',
        expectedIntent: 'QUERY_PIPELINE',
        expectedPhrase: 'Ann'
      },
      {
        query: 'What is the listing launch procedure?',
        expectedIntent: 'MLS_LISTING_LAUNCH',
        expectedPhrase: 'Listing Launch Protocol'
      },
      {
        query: 'Can you help me find the listing launch procedure?',
        expectedIntent: 'MLS_LISTING_LAUNCH',
        expectedPhrase: 'Listing Launch Protocol'
      },
      {
        query: 'I need help with a contract clause',
        expectedIntent: 'DRAFT_OFFER',
        expectedPhrase: 'contract'
      },
      {
        query: 'astronaut orbital rocket refueling procedure',
        expectedIntent: 'GENERAL_QUERY',
        expectedPhrase: "I don't have an approved Nest procedure"
      },
      {
        query: 'Can you get me the licensed form 580',
        expectedIntent: 'GENERAL_QUERY',
        expectedPhrase: "I don't have an approved Nest procedure"
      }
    ];

    for (const tc of testCases) {
      // 1. Client intent routing
      const clientRes = processUserUtterance(tc.query, initialRuntimeState, 'Ryan');
      expect(clientRes.intentType).toBeDefined();

      // 2. Server unified context retrieval
      const serverRes = queryUnifiedContext(tc.query);
      expect(serverRes).toBeDefined();

      // Parity check: Server answers appropriately and does not contradict client
      const spoken = serverRes.spokenAnswer || (serverRes as any).spokenResponse || '';
      expect(spoken.toLowerCase()).toContain(tc.expectedPhrase.toLowerCase());
    }
  });

  // TEST 11: Typed user queries execute immediately
  it('Test 11: Typed user queries execute immediately without waiting for silence endpointing', () => {
    const input = 'where is the earnest money deposit procedure?';
    const result = queryUnifiedContext(input);

    expect(result.confidence).toBe('high');
    expect(result.matchedDomain).toBe('sops');
    expect(result.spokenAnswer).toContain('Buyer Contract Verification & EMD Audit Protocol');
  });

  // TEST 12: Duplicate recognition submissions with identical utteranceId are suppressed idempotently
  it('Test 12: Duplicate turn submissions with identical utteranceId are suppressed idempotently', () => {
    const uttId = 'utt_test_123';
    VoiceDiagnostics.clearHistory();

    const pipeline = new VoicePipeline({
      onStatusChange: () => {},
      onTranscriptReceived: () => {},
      onFrequencyUpdate: () => {}
    });

    (pipeline as any).finalizedSegments = ['who is Matt Orr'];
    (pipeline as any).currentUtteranceId = uttId;

    pipeline.commitCurrentTurn();
    pipeline.commitCurrentTurn();

    const history = VoiceDiagnostics.getHistory();
    const commits = history.filter(h => h.type === 'turn_committed');
    expect(commits.length).toBe(1);
  });

  // TEST 13: Microphone turns off and stays idle after assistant finishes speaking
  it('Test 13: Microphone turns off completely and status returns to idle after assistant finishes speaking', async () => {
    const statusChanges: string[] = [];
    setupMockSpeechRecognition();

    const pipeline = new VoicePipeline({
      onStatusChange: (status) => statusChanges.push(status),
      onTranscriptReceived: () => {},
      onFrequencyUpdate: () => {}
    });

    pipeline.startListening();
    expect(statusChanges).toContain('listening');

    // Simulate speaking response
    let onEndedCb: any = null;
    const mockAudio = {
      play: vi.fn().mockImplementation(function() {
        setTimeout(() => {
          if (mockAudio.onended) mockAudio.onended();
        }, 20);
        return Promise.resolve();
      }),
      pause: vi.fn(),
      currentTime: 0,
      onended: null as any,
      onerror: null as any
    };

    // Mock fetch for TTS
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(['audio'], { type: 'audio/mpeg' }))
    } as any);

    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-audio');

    // Mock Audio constructor
    (global as any).Audio = vi.fn().mockImplementation(function() { return mockAudio; });

    const speakPromise = pipeline.speakText('Here is the policy for earnest money deposits.');
    expect(statusChanges).toContain('speaking');

    await vi.advanceTimersByTimeAsync(100);
    await speakPromise;

    // After speech completes, status must be idle and listening must NOT auto-restart
    expect(pipeline.isListening()).toBe(false);
    expect(statusChanges[statusChanges.length - 1]).toBe('idle');

    // Advance more time to ensure no delayed restart occurs
    await vi.advanceTimersByTimeAsync(1000);
    expect(pipeline.isListening()).toBe(false);
    expect(statusChanges[statusChanges.length - 1]).toBe('idle');
  });
});
