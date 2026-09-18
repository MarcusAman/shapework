import { processUserUtterance } from '../src/services/voice-agent/transcriptRouter';

const mockState = {
  agentName: 'NORA',
  status: 'idle',
  transcriptHistory: [],
  pendingProposal: null,
  errorMessage: null
};

console.log('🧪 Running Stabilization Pass Unit Assertions...\n');

const testCases = [
  {
    input: "Hey Nest, can you help me with a contract?",
    expectedIntentNot: "CONVERSATION_CONTROL",
    expectedTextNot: "Yes, I can hear you",
    description: "Defect 1: Real contract question with 'Hey Nest' must NOT trigger mic check"
  },
  {
    input: "Can you hear me?",
    expectedIntent: "CONVERSATION_CONTROL",
    expectedText: "Yes, I can hear you",
    description: "Exact mic check 'Can you hear me?' MUST trigger mic check"
  },
  {
    input: "Hey Nest",
    expectedIntent: "WAKE_WORD_ONLY",
    expectedText: "Hi, I'm listening.",
    description: "Pure wake phrase 'Hey Nest' MUST trigger WAKE_WORD_ONLY"
  },
  {
    input: "Hey Nest, what needs my attention today?",
    expectedIntentNot: "CONVERSATION_CONTROL",
    expectedIntentNot2: "WAKE_WORD_ONLY",
    description: "Wake phrase plus operational request MUST preserve request"
  }
];

let passed = 0;
let failed = 0;

for (const tc of testCases) {
  const result = processUserUtterance(tc.input, mockState, 'Ryan', 'utt-test-1');
  let ok = true;

  if (tc.expectedIntent && result.intentType !== tc.expectedIntent) ok = false;
  if (tc.expectedIntentNot && result.intentType === tc.expectedIntentNot) ok = false;
  if (tc.expectedIntentNot2 && result.intentType === tc.expectedIntentNot2) ok = false;
  if (tc.expectedText && !result.spokenResponse.includes(tc.expectedText)) ok = false;
  if (tc.expectedTextNot && result.spokenResponse.includes(tc.expectedTextNot)) ok = false;

  if (ok) {
    console.log(`  ✓ ${tc.description}`);
    console.log(`    Input: "${tc.input}" -> Intent: ${result.intentType} | Response: "${result.spokenResponse}"`);
    passed++;
  } else {
    console.error(`  ✕ ${tc.description}`);
    console.error(`    Input: "${tc.input}" -> Intent: ${result.intentType} | Response: "${result.spokenResponse}"`);
    failed++;
  }
}

console.log(`\nResults: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);
