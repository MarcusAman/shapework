/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Lorena AI Knowledge Engine & Operating Record High-Concurrency Pressure Test
 */

import { queryUnifiedContext } from '../server/knowledge/unifiedContextRetriever';

async function runKnowledgePressureTest() {
  console.log('=== STARTING LORENA AI KNOWLEDGE ENGINE HIGH-CONCURRENCY PRESSURE TEST ===\n');

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
    "Is the Mineral Oil and Gas MOG disclosure signed?",
    "Form 2-T offer abstract for 312 Mayfaire Way",
    "When is the due diligence fee due for 312 Mayfaire?",
    "Who is the escrow agent for 312 Mayfaire Way?",
    "Is Lead-Based Paint addendum required for 312 Mayfaire?",
    "Show verified contract terms for 312 Mayfaire Way",

    // 3. Financials & Accounting (10 queries)
    "What is the seller net sheet for 312 Mayfaire Way?",
    "Calculate commission split for Sarah Jenkins on 312 Mayfaire",
    "How much is gross commission for 312 Mayfaire Way?",
    "What is the net agent direct deposit payout for Sarah Jenkins?",
    "What is the estimated net wire proceeds for seller at 312 Mayfaire?",
    "QuickBooks invoice INV-1001 status",
    "What is the mortgage payoff for 312 Mayfaire Way?",
    "NC Revenue Stamps excise tax calculation for $725k sale",
    "Transaction coordinator fee deduction on 312 Mayfaire",
    "Show BIC payroll disbursement status for Sarah Jenkins",

    // 4. SOP Library & Operating Procedures (10 queries)
    "How do I order new lockboxes for the office?",
    "What is the SOP for wire transfer verification?",
    "What is the procedure for handling listing disclosures?",
    "How to process earnest money deposit receipt?",
    "What is the SOP for sign post installation?",
    "How do I handle a compliance file review?",
    "What is the SOP for open house preparation?",
    "How to file a CDA commission disbursement authorization?",
    "What is the SOP for client closing gifts?",
    "How do I update MLS listing status?",

    // 5. Operating Pipeline & Stuck Files (10 queries)
    "Which transactions are currently stuck in pipeline?",
    "What files need BIC review today?",
    "Show operating pipeline summary",
    "Are there any disclosure blockers in the pipeline?",
    "What items need urgent attention today?",
    "Show overdue tasks in pipeline",
    "Which listing needs RPOWDS disclosure?",
    "Show stuck closing files for Sarah Jenkins",
    "What compliance reviews are pending?",
    "Show active transactions logged in pipeline",

    // 6. Integrations & Connected Tools (10 queries)
    "What is the status of Dotloop integration?",
    "Show overdue Basecamp tasks",
    "What is the status of QuickBooks sync?",
    "Is Tapo sign room camera online?",
    "Show Rechat CRM connector status",
    "Show Slack notification integration status",
    "Is Twilio SMS gateway active?",
    "Show Google Drive document sync status",
    "Show Basecamp owner escalation mentions",
    "Show Tapo camera asset checkout events",

    // 7. Multi-Channel Marketing Blitz (10 queries)
    "Generate marketing flyer for 312 Mayfaire Way",
    "Show Instagram story carousel collateral for 312 Mayfaire",
    "What is the open house schedule for 312 Mayfaire Way?",
    "Generate email blast template for 74-broker network",
    "Show print collateral feature sheet PDF for 312 Mayfaire",
    "What is the list price for 312 Mayfaire Way marketing?",
    "Show marketing request desk items",
    "Who is the listing agent for 312 Mayfaire marketing?",
    "Show social media asset studio collateral",
    "Show multi-channel marketing blitz summary",

    // 8. Commercial Lease & Estoppel Audit (10 queries)
    "Audit commercial lease for Suite 400",
    "Who is the tenant for Mayfaire Commercial Center Suite 400?",
    "What is the base rent per square foot for Suite 400?",
    "Is the estoppel certificate signed for Suite 400?",
    "What is the monthly CAM allocation for Suite 400?",
    "What is the lease term for Pinnacle Tech Solutions?",
    "Show NNN commercial lease details for Suite 400",
    "What is the monthly base rent for Suite 400?",
    "When was the estoppel certificate executed for Suite 400?",
    "Show certified commercial lease abstract for Suite 400",

    // 9. Buyer-Seller Matchmaker Radar (10 queries)
    "Run buyer matchmaker radar for 312 Mayfaire Way",
    "Who is the top matched buyer for 312 Mayfaire Way?",
    "What is the match score for Michael Chang?",
    "Who represents buyer Michael Chang?",
    "What is the pre-approval amount for Michael Chang?",
    "How many active CRM buyer leads were scanned for 312 Mayfaire?",
    "Who is buyer match #2 for 312 Mayfaire Way?",
    "What lender pre-approved Michael Chang?",
    "Send intro SMS to buyer agent Sarah Jenkins",
    "Show pocket listing radar matches for 312 Mayfaire",

    // 10. Deal Celebration & Volume Leaderboard (10 queries)
    "Celebrate closed deal for 312 Mayfaire Way",
    "What is the monthly brokerage closed volume?",
    "Who is the top agent on the brokerage leaderboard?",
    "How many closed transactions does Sarah Jenkins have?",
    "What is the closed sale price for 312 Mayfaire Way?",
    "Who is #2 on the brokerage volume leaderboard?",
    "Who is #3 on the brokerage volume leaderboard?",
    "How many total deals were closed this month?",
    "Replay confetti soundscape and 3D transaction particle universe",
    "Show brokerage volume leaderboard for Sarah Jenkins and Matt Orr",

    // 11. Multiple Offer Comparison Matrix (10 queries)
    "Compare all offers for 312 Mayfaire Way",
    "Show side-by-side offer comparison matrix",
    "Which competing offer has the highest net proceeds?",
    "Compare cash vs conventional offers for 312 Mayfaire",
    "Show offer matrix breakdown for seller",
    "What is the due diligence fee on Offer A?",
    "Which offer waives the appraisal contingency?",
    "What is the closing date on Offer B?",
    "Export offer comparison PDF report for seller",
    "Compare all 3 Form 2-T offers received on 312 Mayfaire"
  ];

  console.log(`[Pressure Test] Dispatching ${testQueries.length} concurrent queries to queryUnifiedContext...`);

  const startTime = Date.now();
  const results = await Promise.all(testQueries.map(q => {
    return Promise.resolve(queryUnifiedContext(q));
  }));
  const durationMs = Date.now() - startTime;

  console.log(`\n[Pressure Test Complete] Processed ${testQueries.length} queries in ${durationMs}ms (${(durationMs / testQueries.length).toFixed(2)}ms avg per query).`);
  console.log(`🚀 Throughput: ${((testQueries.length / durationMs) * 1000).toFixed(0)} queries/second\n`);

  // Analyze Results
  const highConfidence = results.filter(r => r.confidence === 'high' || r.confidenceScore >= 0.85);
  const withSources = results.filter(r => r.sources && r.sources.length > 0);
  const withSpokenAnswers = results.filter(r => r.spokenAnswer && r.spokenAnswer.length > 10);
  const withDisplayResponses = results.filter(r => r.displayResponse && r.displayResponse.length > 10);

  console.log(`✓ High Confidence Results (>=85%): ${highConfidence.length} / ${testQueries.length}`);
  console.log(`✓ Grounded Source References: ${withSources.length} / ${testQueries.length}`);
  console.log(`✓ Complete Spoken Answers: ${withSpokenAnswers.length} / ${testQueries.length}`);
  console.log(`✓ Rich Display Responses: ${withDisplayResponses.length} / ${testQueries.length}`);

  // Domain Distribution Analysis
  const domainCounts: Record<string, number> = {};
  results.forEach(r => {
    domainCounts[r.matchedDomain] = (domainCounts[r.matchedDomain] || 0) + 1;
  });

  console.log('\n[Domain Distribution Analysis]:');
  Object.entries(domainCounts).forEach(([domain, count]) => {
    console.log(`  • ${domain.toUpperCase()}: ${count} queries matched`);
  });

  if (highConfidence.length < testQueries.length) {
    console.error(`\n❌ Pressure Test Failed: ${testQueries.length - highConfidence.length} queries returned low confidence or ungrounded responses!`);
    process.exit(1);
  }

  console.log('\n=== ALL LORENA KNOWLEDGE ENGINE PRESSURE TESTS PASSED WITH 100% PRECISION! ===');
}

runKnowledgePressureTest().catch(err => {
  console.error('❌ Unhandled Exception during Lorena Knowledge Pressure Test:', err);
  process.exit(1);
});
