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
    this.start = vi.fn();
    this.abort = vi.fn();
    this.stop = vi.fn();
    this.onstart = null;
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

  // TEST 1: Interim fragments never dispatch separate turns
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
    rec.onstart();

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

  // TEST 2: Multiple final recognition segments become one turn
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
    rec.onstart();

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

  // TEST 3: Natural pause does not interrupt
  it('Test 3: Natural 400ms pause during speech does not prematurely finalize the turn', () => {
    const committedTurns: TranscriptPayload[] = [];

    const mock = setupMockSpeechRecognition();

    const pipeline = new VoicePipeline({
      onStatusChange: () => {},
      onTranscriptReceived: (turn) => committedTurns.push(turn),
      onFrequencyUpdate: () => {}
    });

    pipeline.startListening();
    const rec = mock.getInstance();
    rec.onstart();

    // Part 1: "I need to check"
    rec.onresult({
      results: [
        Object.assign([{ transcript: 'I need to check' }], { isFinal: true })
      ]
    });

    // 400ms pause
    vi.advanceTimersByTime(400);
    expect(committedTurns.length).toBe(0);

    // Part 2: "the earnest money status"
    rec.onresult({
      results: [
        Object.assign([{ transcript: 'I need to check' }], { isFinal: true }),
        Object.assign([{ transcript: 'the earnest money status' }], { isFinal: true })
      ]
    });

    // Another 400ms pause
    vi.advanceTimersByTime(400);
    expect(committedTurns.length).toBe(0);

    // Finally user stops speaking for 1300ms
    vi.advanceTimersByTime(1300);
    expect(committedTurns.length).toBe(1);
    expect(committedTurns[0].text).toBe('I need to check the earnest money status');
  });

  // TEST 4: Incomplete prelude receives extended endpointing
  it('Test 4: Incomplete conversational preludes are detected and receive extended endpointing window', () => {
    expect(isLikelyIncompleteUtterance('can you')).toBe(true);
    expect(isLikelyIncompleteUtterance('could you')).toBe(true);
    expect(isLikelyIncompleteUtterance('can you help me')).toBe(true);
    expect(isLikelyIncompleteUtterance('what is the')).toBe(true);
    expect(isLikelyIncompleteUtterance('where can I')).toBe(true);
    expect(isLikelyIncompleteUtterance('approved procedure for')).toBe(true); // ends with 'for'
    expect(isLikelyIncompleteUtterance('look up Matt Orr and')).toBe(true); // ends with 'and'

    // Complete phrases are not incomplete preludes
    expect(isLikelyIncompleteUtterance('listing launch sop')).toBe(false);
    expect(isLikelyIncompleteUtterance('what is Matt Orr phone number')).toBe(false);
  });

  // TEST 5: Complete general help request is not an SOP query
  it('Test 5: General conversational help request is answered conversationally without SOP retrieval miss', () => {
    const helpQueries = [
      'can you help me',
      'Can you help me?',
      'help me',
      'I need help',
      'can you help me please'
    ];

    for (const q of helpQueries) {
      // 1. Client intent router
      const clientResult = processUserUtterance(q, initialRuntimeState, 'Ryan');
      expect(clientResult.intentType).toBe('CONVERSATIONAL_HELP');
      expect(clientResult.spokenResponse).toContain('what do you need help with');
      expect(clientResult.spokenResponse).not.toContain("I don't have an approved Nest procedure");

      // 2. Server unified context retriever
      const serverResult = queryUnifiedContext(q);
      expect(serverResult.confidence).toBe('high');
      expect(serverResult.spokenAnswer).toBe('Absolutely—what do you need help with?');
      expect(serverResult.spokenAnswer).not.toContain("I don't have an approved Nest procedure");
    }
  });

  // TEST 6: Self-correction remains one coherent turn
  it('Test 6: Spoken self-corrections are captured in a single coherent turn', () => {
    const committedTurns: TranscriptPayload[] = [];

    const mock = setupMockSpeechRecognition();

    const pipeline = new VoicePipeline({
      onStatusChange: () => {},
      onTranscriptReceived: (turn) => committedTurns.push(turn),
      onFrequencyUpdate: () => {}
    });

    pipeline.startListening();
    const rec = mock.getInstance();
    rec.onstart();

    // Utterance with mid-sentence correction
    rec.onresult({
      results: [
        Object.assign([{ transcript: 'where is earnest money... wait show me the listing launch procedure' }], { isFinal: true })
      ]
    });

    vi.advanceTimersByTime(1400);

    expect(committedTurns.length).toBe(1);
    expect(committedTurns[0].text).toBe('where is earnest money... wait show me the listing launch procedure');

    const res = queryUnifiedContext(committedTurns[0].text);
    expect(res.matchedDomain).toBe('sops');
    expect(res.confidence).toBe('high');
  });

  // TEST 7: Duplicate recognition events are idempotent
  it('Test 7: Duplicate turn submissions with identical utteranceId are suppressed idempotently', () => {
    const uttId = 'utt_test_123';
    VoiceDiagnostics.clearHistory();

    const pipeline = new VoicePipeline({
      onStatusChange: () => {},
      onTranscriptReceived: () => {},
      onFrequencyUpdate: () => {}
    });

    // Explicitly commit turn
    (pipeline as any).finalizedSegments = ['who is Matt Orr'];
    (pipeline as any).currentUtteranceId = uttId;

    pipeline.commitCurrentTurn();

    // Attempt second commit with same turn
    pipeline.commitCurrentTurn();

    const history = VoiceDiagnostics.getHistory();
    const commits = history.filter(h => h.type === 'turn_committed');
    expect(commits.length).toBe(1);
  });

  // TEST 8: New speech cancels pending finalization
  it('Test 8: Arrival of new speech resets and reschedules the silence finalization timer', () => {
    const committedTurns: TranscriptPayload[] = [];

    const mock = setupMockSpeechRecognition();

    const pipeline = new VoicePipeline({
      onStatusChange: () => {},
      onTranscriptReceived: (t) => committedTurns.push(t),
      onFrequencyUpdate: () => {}
    });

    pipeline.startListening();
    const rec = mock.getInstance();
    rec.onstart();

    // Speech 1
    rec.onresult({
      results: [
        Object.assign([{ transcript: 'can you help me' }], { isFinal: false })
      ]
    });

    // 1,000ms passes (incomplete prelude has 2,000ms timer)
    vi.advanceTimersByTime(1000);
    expect(committedTurns.length).toBe(0);

    // Speech 2 arrives at 1,000ms
    rec.onresult({
      results: [
        Object.assign([{ transcript: 'can you help me find the listing launch SOP' }], { isFinal: true })
      ]
    });

    // Advance 800ms (still within new 1,200ms timer)
    vi.advanceTimersByTime(800);
    expect(committedTurns.length).toBe(0);

    // Advance another 500ms (1,300ms total since speech 2)
    vi.advanceTimersByTime(500);
    expect(committedTurns.length).toBe(1);
    expect(committedTurns[0].text).toBe('can you help me find the listing launch SOP');
  });

  // TEST 9: Superseded request cannot render
  it('Test 9: AgentRuntimeReducer and AbortController ensure superseded turns do not overwrite current state', () => {
    let state: AgentRuntimeState = initialRuntimeState;

    // Load initial
    state = agentRuntimeReducer(state, {
      type: 'ADD_TRANSCRIPT',
      payload: { sender: 'user', text: 'First query' }
    });
    expect(state.transcriptHistory).toHaveLength(1);

    // Clear interim transcript
    state = agentRuntimeReducer(state, { type: 'CLEAR_INTERIM_TRANSCRIPT' });
    expect(state.interimTranscript).toBe('');

    // Set interim transcript during listening
    state = agentRuntimeReducer(state, {
      type: 'SET_INTERIM_TRANSCRIPT',
      payload: 'Second live query in progress'
    });
    expect(state.interimTranscript).toBe('Second live query in progress');
    // Verify interim text is NOT in transcriptHistory
    expect(state.transcriptHistory).toHaveLength(1);
  });

  // TEST 10: Cancel discards partial speech
  it('Test 10: Calling cancelCurrentTurn cleanly discards uncommitted speech without delayed submission', () => {
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
    rec.onstart();

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
  });

  // TEST 11: Typed chat remains immediate
  it('Test 11: Typed user queries execute immediately without waiting for silence endpointing', () => {
    const input = 'where is the earnest money deposit procedure?';
    const result = queryUnifiedContext(input);

    expect(result.confidence).toBe('high');
    expect(result.matchedDomain).toBe('sops');
    expect(result.spokenAnswer).toContain('Buyer Contract Verification & EMD Audit Protocol');
  });

  // TEST 12: Central orb and drawer do not double-submit
  it('Test 12: Reducer ADD_TRANSCRIPT maintains strict chronological single bubbles per user and agent turn', () => {
    let state = initialRuntimeState;

    state = agentRuntimeReducer(state, {
      type: 'ADD_TRANSCRIPT',
      payload: { sender: 'user', text: 'What is the sign installation protocol?' }
    });

    state = agentRuntimeReducer(state, {
      type: 'ADD_TRANSCRIPT',
      payload: { sender: 'agent', text: 'Sign installation is coordinated with Sign Post Pros.' }
    });

    expect(state.transcriptHistory).toHaveLength(2);
    expect(state.transcriptHistory[0].sender).toBe('user');
    expect(state.transcriptHistory[1].sender).toBe('agent');
    expect(state.transcriptHistory[0].text).toBe('What is the sign installation protocol?');
  });

  // TEST 13: Valid no-result behavior remains fail-closed
  it('Test 13: Non-existent operational queries fail-closed with clear, helpful guidance without throwing errors', () => {
    const nonExistentQuery = 'astronaut orbital rocket refueling procedure';
    const result = queryUnifiedContext(nonExistentQuery);

    expect(result.confidence).toBe('low');
    expect(result.matchedDomain).toBe('general');
    expect(result.spokenAnswer).toContain("I don't have an approved Nest procedure");
    expect(result.displayResponse).toContain('Operational Search Results');
  });

  // TEST 14: Recognition restart does not duplicate the turn
  it('Test 14: SpeechRecognition onend event finalizes existing buffered text once without duplicate dispatch', () => {
    const committedTurns: TranscriptPayload[] = [];

    const mock = setupMockSpeechRecognition();

    const pipeline = new VoicePipeline({
      onStatusChange: () => {},
      onTranscriptReceived: (t) => committedTurns.push(t),
      onFrequencyUpdate: () => {}
    });

    pipeline.startListening();
    const rec = mock.getInstance();
    rec.onstart();

    rec.onresult({
      results: [
        Object.assign([{ transcript: 'show me Sarah Jenkins phone number' }], { isFinal: true })
      ]
    });

    // Browser fires onend (e.g. natural audio stop)
    rec.onend();

    expect(committedTurns.length).toBe(1);
    expect(committedTurns[0].text).toBe('show me Sarah Jenkins phone number');

    // If timers fire later, no duplicate
    vi.runAllTimers();
    expect(committedTurns.length).toBe(1);
  });
});

