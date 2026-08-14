import { queryUnifiedContext } from '../server/knowledge/unifiedContextRetriever';

console.log('🧪 Testing queryUnifiedContext with Live SOP Queries...\n');

const queries = [
  "Where's the listing launch SOP?",
  "What is the buyer contract verification procedure?",
  "How do we handle sign vendor post installations?",
  "Show me the marketing intake protocol",
  "What is our policy on buyer agency and WWREA?",
  "Show me all active standard operating procedures"
];

for (const q of queries) {
  const res = queryUnifiedContext(q, { tenantId: 'tenant_nest_uat', workspaceId: 'ws_wilmington' });
  console.log(`Q: "${q}"`);
  console.log(`  -> Domain: ${res.matchedDomain} | Confidence: ${res.confidence} (${res.confidenceScore})`);
  console.log(`  -> Spoken: "${res.spokenAnswer}"`);
  console.log(`  -> Action Card: ${res.evidenceCard?.title} (DeepLink: ${res.evidenceCard?.deepLinkUrl})`);
  console.log(`  -> DataPoints:`, Object.keys(res.evidenceCard?.dataPoints || {}).join(', '));
  console.log('');
}

console.log('✅ Live SOP RAG Query Verification Complete!');
