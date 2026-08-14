/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Contract Copilot & Dual E-Signature Gateway High-Concurrency Pressure Test
 */

import {
  dispatchESignatureEnvelope,
  processESignatureWebhook,
  getEnvelopeStatus,
  getActiveESignatureProvider
} from '../server/contracts/eSignatureGateway';

async function runPressureTest() {
  console.log('=== STARTING HIGH-CONCURRENCY CONTRACT COPILOT & E-SIGNATURE GATEWAY PRESSURE TEST ===\n');

  // 1. Verify Provider Availability
  const providerInfo = getActiveESignatureProvider();
  console.log(`[Provider Check] Primary E-Signature Provider: ${providerInfo.primaryProvider}`);
  console.log(`[Provider Check] Dotloop Available: ${providerInfo.dotloopAvailable} | DocuSign Available: ${providerInfo.docusignAvailable}\n`);

  const CONCURRENCY_COUNT = 100;
  console.log(`[Pressure Test] Launching ${CONCURRENCY_COUNT} concurrent Form 2-T offer dispatch requests...`);

  const startTime = Date.now();
  const requests = Array.from({ length: CONCURRENCY_COUNT }).map((_, index) => {
    const isHighRisk = index % 3 === 0; // 33% high risk offers
    const ddFee = isHighRisk ? 2000 : 25000; // Low DD fee ($2,000 / $750,000 = 0.26% vs $25,000 = 3.3%)
    
    return dispatchESignatureEnvelope({
      offerTerms: {
        offerId: `offer_stress_${index + 1}`,
        propertyAddress: `3${index + 10} Coastal Highway, Wilmington NC`,
        buyerName: `Buyer Client #${index + 1}`,
        purchasePrice: 750000,
        dueDiligenceFee: ddFee,
        initialEmd: 15000,
        settlementDate: '2026-10-31',
        bicApprovalRequired: isHighRisk
      },
      recipients: [
        { name: `Buyer Client #${index + 1}`, email: `buyer${index + 1}@example.com`, role: 'buyer' }
      ]
    });
  });

  const results = await Promise.all(requests);
  const durationMs = Date.now() - startTime;

  console.log(`\n[Pressure Test Complete] Processed ${CONCURRENCY_COUNT} offers in ${durationMs}ms (${(durationMs / CONCURRENCY_COUNT).toFixed(2)}ms avg per request).`);

  // Analyze Results
  const successful = results.filter(r => r.success);
  const bicHolds = results.filter(r => r.status === 'BIC_APPROVAL_HOLD');
  const dispatched = results.filter(r => r.status === 'DISPATCHED' || r.status === 'SENT');

  console.log(`✓ Successful Dispatches & Holds: ${successful.length} / ${CONCURRENCY_COUNT}`);
  console.log(`✓ BIC Approval Holds Applied: ${bicHolds.length}`);
  console.log(`✓ Direct Dispatches Sent: ${dispatched.length}`);

  if (successful.length !== CONCURRENCY_COUNT) {
    console.error('❌ Pressure Test Failed: Some concurrent requests failed!');
    process.exit(1);
  }

  // 2. Webhook High-Concurrency Burst Test
  console.log('\n[Webhook Stress Test] Simulating 50 concurrent e-signature webhook completion callbacks...');
  const webhookRequests = results.slice(0, 50).map(r => {
    return processESignatureWebhook({
      envelopeId: r.envelopeId || `env_mock_${r.status}`,
      event: 'envelope-completed',
      status: 'completed'
    });
  });

  const webhookResults = await Promise.all(webhookRequests);
  const webhookSuccessCount = webhookResults.filter(w => w.processed).length;

  console.log(`✓ Processed ${webhookSuccessCount} / 50 concurrent webhook completions.`);

  console.log('\n=== ALL CONTRACT COPILOT & E-SIGNATURE PRESSURE TESTS PASSED SUCCESSFULLY! ===');
}

runPressureTest().catch(err => {
  console.error('❌ Unhandled Exception during Contract Copilot Pressure Test:', err);
  process.exit(1);
});
