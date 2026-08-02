import { AICopilotService } from '../server/ai/aiCopilotService';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

async function runTests() {
  console.log('Running AI Copilot service unit tests...');

  // Setup fake database states
  const fakeDbState: any = {
    opsSops: [],
    opsKnowledgeDocuments: [
      {
        id: 'doc_1',
        workspaceId: 'nest-realty-demo',
        title: 'Sign policy',
        content: 'Photography must be scheduled and completed at least 24 hours prior to listing launch.',
        status: 'indexed',
        metadata: {
          roles: ['broker_agent'],
          topics: ['photography', 'listings']
        }
      }
    ],
    organization: {
      positions: [
        { name: 'Broker Agent' }
      ]
    }
  };

  const fakePersistState = async (wsId: string) => {};

  // Test 1: Grounded QA - matching answer
  console.log('Testing answerFromKnowledge with matching topic...');
  const result1 = await AICopilotService.answerFromKnowledge(
    fakeDbState,
    fakePersistState,
    'nest-realty-demo',
    'agent@nestrealty.com',
    'When must photography be completed?'
  );
  assert(result1.result !== null, 'should return a result');
  assert(result1.result.answer.includes('24 hours prior') || result1.result.answer.includes('fully supported'), 'answer should contain details from doc_1');
  assert(result1.result.sources.length > 0, 'should return citations');
  assert(result1.result.unsupportedQuestion === false, 'unsupportedQuestion should be false');

  // Test 2: Grounded QA - non-matching deflection
  console.log('Testing answerFromKnowledge with out-of-knowledge topic...');
  const result2 = await AICopilotService.answerFromKnowledge(
    fakeDbState,
    fakePersistState,
    'nest-realty-demo',
    'agent@nestrealty.com',
    'What is the dress code for office parties?'
  );
  assert(result2.result.unsupportedQuestion === true, 'should flag as unsupported/out-of-knowledge');

  // Test 3: SOP rough-description mock draft generation
  console.log('Testing generateDraft...');
  const result3 = await AICopilotService.generateDraft(
    fakeDbState,
    fakePersistState,
    'nest-realty-demo',
    'agent@nestrealty.com',
    'Need to launch a new listing'
  );
  assert(result3.result !== null, 'should generate draft SOP structure');
  assert(result3.result.title !== '', 'SOP title should be generated');
  assert(result3.result.steps.length > 0, 'SOP checklist steps should be generated');

  // Test 4: Find operational gaps
  console.log('Testing findKnowledgeGaps...');
  const result4 = await AICopilotService.findKnowledgeGaps(fakeDbState, 'nest-realty-demo');
  assert(result4.length > 0, 'should return gaps analysis findings');

  console.log('All AI Copilot unit tests PASSED!');
}

runTests().catch((err) => {
  console.error('Test run error:', err);
  process.exit(1);
});
