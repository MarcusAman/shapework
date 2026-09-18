import { describe, it, expect } from 'vitest';
import {
  getActiveESignatureProvider,
  getDotloopAuthUrl,
  getDocuSignAuthUrl,
  handleOAuthCallback,
  dispatchESignatureEnvelope,
  processESignatureWebhook,
  getEnvelopeStatus
} from '../../server/contracts/eSignatureGateway';

describe('Dual Provider E-Signature & OAuth Gateway', () => {
  it('detects active provider configuration correctly', () => {
    const status = getActiveESignatureProvider();
    expect(status).toHaveProperty('dotloopAvailable');
    expect(status).toHaveProperty('docusignAvailable');
    expect(status).toHaveProperty('primaryProvider');
  });

  it('generates correct OAuth redirect URLs for Dotloop and DocuSign', () => {
    const dotloopUrl = getDotloopAuthUrl('http://localhost:3000/api/contracts/esign/auth/dotloop/callback');
    expect(dotloopUrl).toContain('auth.dotloop.com');
    expect(dotloopUrl).toContain('redirect_uri=');

    const docuSignUrl = getDocuSignAuthUrl('http://localhost:3000/api/contracts/esign/auth/docusign/callback');
    expect(docuSignUrl).toContain('account-d.docusign.com');
    expect(docuSignUrl).toContain('redirect_uri=');
  });

  it('handles OAuth token callbacks successfully', async () => {
    const dotloopRes = await handleOAuthCallback('dotloop', 'test_code_123');
    expect(dotloopRes.success).toBe(true);
    expect(dotloopRes.provider).toBe('dotloop');

    const dsRes = await handleOAuthCallback('docusign', 'test_ds_code_456');
    expect(dsRes.success).toBe(true);
    expect(dsRes.provider).toBe('docusign');
  });

  it('dispatches e-signature envelope and applies BIC hold for high-risk offers', async () => {
    // Normal offer
    const normalOffer = await dispatchESignatureEnvelope({
      offerTerms: {
        offerId: 'offer_test_1',
        propertyAddress: '312 Mayfaire Way',
        buyerName: 'David Miller',
        purchasePrice: 725000,
        dueDiligenceFee: 15000,
        initialEmd: 10000,
        settlementDate: '2026-10-15',
        bicApprovalRequired: false
      },
      recipients: [{ name: 'David Miller', email: 'david@example.com', role: 'buyer' }]
    });

    expect(normalOffer.success).toBe(true);
    expect(normalOffer.envelopeId).toBeDefined();

    // High risk offer requiring BIC approval (Low DD ratio < 1.0% + bicApprovalRequired flag)
    const holdOffer = await dispatchESignatureEnvelope({
      offerTerms: {
        offerId: 'offer_test_2',
        propertyAddress: '312 Mayfaire Way',
        buyerName: 'David Miller',
        purchasePrice: 725000,
        dueDiligenceFee: 5000, // 0.69%
        initialEmd: 10000,
        settlementDate: '2026-10-15',
        bicApprovalRequired: true
      },
      recipients: [{ name: 'David Miller', email: 'david@example.com', role: 'buyer' }]
    });

    expect(holdOffer.success).toBe(true);
    expect(holdOffer.status).toBe('BIC_APPROVAL_HOLD');
  });

  it('processes incoming e-signature webhook payload and updates ledger status', () => {
    const webhookRes = processESignatureWebhook({
      envelopeId: 'env_webhook_test_999',
      event: 'envelope-completed',
      status: 'completed'
    });

    expect(webhookRes.processed).toBe(true);
    expect(webhookRes.status).toBe('COMPLETED');

    const status = getEnvelopeStatus('env_webhook_test_999');
    expect(status?.status).toBe('COMPLETED');
  });
});
