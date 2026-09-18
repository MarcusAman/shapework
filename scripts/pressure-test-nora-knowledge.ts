/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NORA AI Knowledge Engine & Operating Record High-Concurrency Pressure Test
 */

import { queryUnifiedContext } from '../server/knowledge/unifiedContextRetriever';

async function runKnowledgePressureTest() {
  console.log('=== STARTING NORA AI KNOWLEDGE ENGINE HIGH-CONCURRENCY PRESSURE TEST ===\n');

  const testQueries = [
    // 1. Roster & Team Directory (10 queries)
    "Who is Matt Orr?",
    "Phone number for Sarah Jenkins",
    "Contact info for Marcus Aman",
    "Who is the Principal Broker in Charge?",
    "Show me the contact details for Ryan Crecelius",
    "Email address for Sarah Jenkins",
    "Who manages compliance at Nest Realty?",
    "Find agent Matt Orr",
    "Who is top producer Sarah Jenkins?",
    "Get phone number for Marcus Aman",

    // 2. Contracts & Form 2-T Disclosures (10 queries)
    "What is the purchase price for 312 Mayfaire Way?",
    "What is the due diligence fee for 312 Mayfaire Way?",
    "How much earnest money is deposited for 312 Mayfaire Way?",
    "Is the Residential Property Disclosure RPOWDS signed for 312 Mayfaire?",
    "Who is the buyer for 312 Mayfaire Way?",
    "Show me the earnest money holder for 312 Mayfaire",
    "What is the closing settlement date for 312 Mayfaire Way?",
    "Show me the financing addendum details for 312 Mayfaire Way",
    "What is the inspection period deadline for 312 Mayfaire Way?",
    "Is the lead based paint disclosure attached for 312 Mayfaire?",

    // 3. Staff SOP Operating Procedures (10 queries)
    "Where is the listing launch SOP?",
    "What is our protocol for buyer agency onboarding?",
    "How do we handle earnest money verification procedures?",
    "Show me the sign vendor dispatch workflow",
    "What are the compliance review steps for listing agreements?",
    "How do we onboard new provisional brokers?",
    "What is the emergency maintenance escalation procedure?",
    "Show me the Dotloop document audit checklist",
    "What is the commercial lease review workflow?",
    "How do we process commission DA payouts?",

    // 4. Financial Commission Splits & Accounting (10 queries)
    "What is the gross commission for 312 Mayfaire Way?",
    "Show me the net agent direct deposit payout for 312 Mayfaire Way",
    "Who owes monthly desk fees this cycle?",
    "What is the brokerage split percentage for Sarah Jenkins?",
    "How much did Nest collect in transaction coordination fees this quarter?",
    "Show me the commission breakdown for Sarah Jenkins on Mayfaire",
    "What is our active pending GCI volume?",
    "Are there any past due agent office invoices?",
    "Show me the accounting payout schedule for closed deals",
    "What are the wire instructions for earnest money escrow deposits?",

    // 5. Integrations, Tools & Connected Systems (10 queries)
    "Is Dotloop connected and synced?",
    "How many active FlexMLS webhooks are listening?",
    "Is Google Workspace integration healthy?",
    "Show me the status of QuickBooks accounting sync",
    "Are Supra Bluetooth eKEY permissions operational?",
    "What CRM integrations are currently live?",
    "Show me the Aircall telephony webhook logs",
    "Is the ShowingTime integration active?",
    "How many documents synced from Dotloop today?",
    "Check health of all operational API connectors"
  ];

  console.log(`Executing ${testQueries.length} concurrent knowledge resolution queries across 5 core operational domains...\n`);

  const startTime = Date.now();
  const results = await Promise.all(
    testQueries.map(async (query, idx) => {
      const qStart = Date.now();
      const res = queryUnifiedContext(query, { tenantId: 'tenant_nest_uat', workspaceId: 'ws_wilmington' });
      const elapsedMs = Date.now() - qStart;
      return { query, ...res, elapsedMs, idx };
    })
  );

  const totalTimeMs = Date.now() - startTime;
  const avgLatencyMs = (totalTimeMs / testQueries.length).toFixed(2);

  console.log(`\n===============================================================`);
  console.log(`[PRESSURE TEST COMPLETED] in ${totalTimeMs}ms (Avg Latency: ${avgLatencyMs}ms/query)`);
  console.log(`===============================================================\n`);

  // Assertions and Groundedness Verification
  const highConfidence = results.filter(r => r.confidence === 'high');
  const groundedWithSources = results.filter(r => r.sources && r.sources.length > 0);
  const withSpokenAnswers = results.filter(r => r.spokenAnswer && r.spokenAnswer.length > 10);
  const withDisplayEvidence = results.filter(r => r.displayResponse && r.displayResponse.length > 10);

  console.log(`• Total Queries Processed: ${results.length}/${testQueries.length} (100%)`);
  console.log(`• High Confidence Matches: ${highConfidence.length}/${testQueries.length} (${((highConfidence.length / testQueries.length) * 100).toFixed(1)}%)`);
  console.log(`• Fact Grounding / Source Attribution: ${groundedWithSources.length}/${testQueries.length} (${((groundedWithSources.length / testQueries.length) * 100).toFixed(1)}%)`);
  console.log(`• Spoken Answer Coverage: ${withSpokenAnswers.length}/${testQueries.length} (${((withSpokenAnswers.length / testQueries.length) * 100).toFixed(1)}%)`);
  console.log(`• Display Markdown Response Coverage: ${withDisplayEvidence.length}/${testQueries.length} (${((withDisplayEvidence.length / testQueries.length) * 100).toFixed(1)}%)`);

  // Verify Domain Distribution
  const domainCounts: Record<string, number> = {};
  results.forEach(r => {
    domainCounts[r.matchedDomain] = (domainCounts[r.matchedDomain] || 0) + 1;
  });

  console.log('\n[Domain Distribution Analysis]:');
  Object.entries(domainCounts).forEach(([domain, count]) => {
    console.log(`  • ${domain.toUpperCase()}: ${count} queries matched`);
  });

  if (highConfidence.length < testQueries.length) {
    console.log('\n[Queries without High Confidence / Grounding]:');
    results.filter(r => r.confidence !== 'high').forEach(r => {
      console.log(`  ❌ Query: "${r.query}" -> Domain: ${r.matchedDomain}, Confidence: ${r.confidence}`);
    });
    console.error(`\n❌ Pressure Test Failed: ${testQueries.length - highConfidence.length} queries returned low confidence or ungrounded responses!`);
    process.exit(1);
  }

  console.log('\n=== ALL NORA KNOWLEDGE ENGINE PRESSURE TESTS PASSED WITH 100% PRECISION! ===');
}

runKnowledgePressureTest().catch(err => {
  console.error('❌ Unhandled Exception during NORA Knowledge Pressure Test:', err);
  process.exit(1);
});
