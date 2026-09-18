import { describe, it, expect } from 'vitest';
import { dispatchESignatureEnvelope, getEnvelopeStatus } from '../../server/contracts/eSignatureGateway';

describe('Contract Copilot Dual-Provider E-Signature & Timeline Tracker Suite', () => {
  it('dispatches envelope and tracks timeline status', async () => {
    const res = await dispatchESignatureEnvelope({
      providerPreference: 'dotloop',
      offerTerms: {
        offerId: 'offer_timeline_001',
        propertyAddress: '312 Mayfaire Way, Wilmington NC 28405',
        buyerName: 'David Miller',
        purchasePrice: 725000,
        dueDiligenceFee: 15000,
        initialEmd: 10000,
        settlementDate: '2026-10-15',
        bicApprovalRequired: false
      },
      recipients: [
        { name: 'David Miller', email: 'david@example.com', role: 'buyer' },
        { name: 'Sarah Miller', email: 'sarah@example.com', role: 'buyer' }
      ]
    });

    expect(res.success).toBe(true);
    expect(res.envelopeId).toBeDefined();

    const status = await getEnvelopeStatus(res.envelopeId);
    expect(status).toHaveProperty('status');
    expect(['out_for_signature', 'delivered', 'sent', 'completed', 'unknown', 'DISPATCHED_PENDING_SIGNATURE']).toContain(status.status);
  });

  it('dispatches DocuSign envelope with direct buyer recipients', async () => {
    const res = await dispatchESignatureEnvelope({
      providerPreference: 'docusign',
      offerTerms: {
        offerId: 'offer_timeline_002',
        propertyAddress: '104 Coastal Dr, Wilmington NC 28409',
        buyerName: 'Robert Davis',
        purchasePrice: 1250000,
        dueDiligenceFee: 30000,
        initialEmd: 25000,
        settlementDate: '2026-10-15',
        bicApprovalRequired: false
      },
      recipients: [
        { name: 'Robert Davis', email: 'robert@example.com', role: 'buyer' }
      ]
    });

    expect(res.success).toBe(true);
    expect(res.envelopeId).toBeDefined();
  });
});
