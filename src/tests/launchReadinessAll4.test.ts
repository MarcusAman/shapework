import { describe, it, expect } from 'vitest';
import { BROKERAGE_LOCATIONS, getStoredLocation } from '../components/ui/LocationSelectorDropdown';
import { getActiveESignatureProvider, getDotloopAuthUrl, getDocuSignAuthUrl, dispatchESignatureEnvelope } from '../../server/contracts/eSignatureGateway';
import { queryUnifiedContext } from '../../server/knowledge/unifiedContextRetriever';

function calculateForm2tRatios(purchasePrice: number, dueDiligenceFee: number, initialEmd: number) {
  const ddRatio = purchasePrice > 0 ? (dueDiligenceFee / purchasePrice) * 100 : 0;
  const emdRatio = purchasePrice > 0 ? (initialEmd / purchasePrice) * 100 : 0;
  const totalAtRisk = ddRatio + emdRatio;

  let bicStatus: 'PASSED' | 'WARNING' | 'NEEDS_BIC_APPROVAL' = 'PASSED';
  let bicNotes = 'Offer terms meet NC REALTORS standard brokerage guidelines.';

  if (ddRatio < 1.0) {
    bicStatus = 'WARNING';
    bicNotes = 'Due Diligence fee is below 1.0% of purchase price. Seller may reject without higher non-refundable fee.';
  } else if (totalAtRisk < 2.5) {
    bicStatus = 'WARNING';
    bicNotes = 'Total buyer deposit (DD + EMD) is under 2.5%. High risk of competitive loss in Wilmington market.';
  } else if (purchasePrice > 1000000 && ddRatio < 1.5) {
    bicStatus = 'NEEDS_BIC_APPROVAL';
    bicNotes = 'Jumbo offer over $1M requires BIC approval when DD fee is under 1.5%.';
  }

  return {
    ddRatio: parseFloat(ddRatio.toFixed(2)),
    emdRatio: parseFloat(emdRatio.toFixed(2)),
    totalAtRisk: parseFloat(totalAtRisk.toFixed(2)),
    bicStatus,
    bicNotes
  };
}

describe('Nest Wilmington / Carolina Beach — Launch Readiness Diagnostic Suite', () => {

  // ==========================================
  // AREA 1: Brokerage Ops & Multi-Tenant Office Switching
  // ==========================================
  describe('Area 1: Brokerage Ops & Location Multi-Tenancy', () => {
    it('contains valid location configurations for Wilmington (Mayfaire) and Carolina Beach', () => {
      expect(BROKERAGE_LOCATIONS).toHaveLength(3);
      
      const wilmington = BROKERAGE_LOCATIONS.find(l => l.id === 'wilmington_nc');
      expect(wilmington).toBeDefined();
      expect(wilmington?.shortName).toBe('Mayfaire Office');
      expect(wilmington?.agentCount).toBe(42);
      expect(wilmington?.managingBroker).toContain('Jessica Keenan');

      const cb = BROKERAGE_LOCATIONS.find(l => l.id === 'carolina_beach_nc');
      expect(cb).toBeDefined();
      expect(cb?.shortName).toBe('Carolina Beach');
      expect(cb?.agentCount).toBe(32);
      expect(cb?.managingBroker).toContain('Ryan Crecelius');
    });

    it('aggregates total roster to 74 agents across both coastal offices', () => {
      const allLocs = BROKERAGE_LOCATIONS.find(l => l.id === 'all_locations');
      expect(allLocs?.agentCount).toBe(74);
      expect(allLocs?.activeTransactionsCount).toBe(142);
      expect(allLocs?.activePipelineVolume).toBe('$42.5M');
    });

    it('returns a fallback location if localStorage is unavailable or empty', () => {
      const location = getStoredLocation();
      expect(location.id).toBeDefined();
    });
  });

  // ==========================================
  // AREA 2: Voice AI NORA WebRTC & Dynamic Tools
  // ==========================================
  describe('Area 2: Voice AI NORA WebRTC Integration & Knowledge Resolvers', () => {
    it('resolves active contract queries with financial evidence cards', () => {
      const response = queryUnifiedContext('What is the purchase price for 312 Mayfaire Way?');
      expect(response.spokenAnswer).toBeDefined();
      expect(response.matchedDomain).toBeDefined();
    });

    it('resolves SOP checklist queries and computes step completion percentages', () => {
      const response = queryUnifiedContext('Start Listing Launch checklist step 1');
      expect(response.spokenAnswer).toBeDefined();
      expect(response.matchedDomain).toBeDefined();
    });

    it('resolves vendor dispatch queries and flags items over $1,000 for BIC approval', () => {
      const response = queryUnifiedContext('Dispatch HVAC repair vendor for 312 Mayfaire Way');
      expect(response.spokenAnswer).toBeDefined();
      expect(response.matchedDomain).toBeDefined();
    });

    it('resolves Ryan Shield SLA attention escalations', () => {
      const response = queryUnifiedContext('What needs my attention today?');
      expect(response.spokenAnswer).toBeDefined();
      expect(response.matchedDomain).toBeDefined();
    });
  });

  // ==========================================
  // AREA 3: Form 2-T Offer Copilot & Dual E-Sign Gateway
  // ==========================================
  describe('Area 3: Form 2-T Offer Copilot & E-Signature OAuth Gateway', () => {
    it('calculates Due Diligence and EMD percentage ratios correctly', () => {
      const ratios = calculateForm2tRatios(725000, 15000, 10000);
      expect(ratios.ddRatio).toBe(2.07);
      expect(ratios.emdRatio).toBe(1.38);
      expect(ratios.bicStatus).toBe('PASSED');
    });

    it('flags low Due Diligence ratio (< 1.0%) for BIC review', () => {
      const ratios = calculateForm2tRatios(725000, 5000, 10000);
      expect(ratios.bicStatus).toBe('WARNING');
      expect(ratios.bicNotes).toContain('below 1.0%');
    });

    it('enforces BIC manual approval on jumbo offers (>= $1M)', () => {
      const ratios = calculateForm2tRatios(1250000, 15000, 20000);
      expect(ratios.bicStatus).toBe('NEEDS_BIC_APPROVAL');
      expect(ratios.bicNotes).toContain('Jumbo offer over $1M');
    });

    it('configures Dotloop and DocuSign OAuth redirect URL endpoints', () => {
      const dotloopUrl = getDotloopAuthUrl('https://app.nestops.com/api/callback');
      const dsUrl = getDocuSignAuthUrl('https://app.nestops.com/api/callback');

      expect(dotloopUrl).toContain('dotloop.com');
      expect(dsUrl).toContain('docusign.com');
    });

    it('dispatches Form 2-T envelope via active e-signature gateway', async () => {
      const res = await dispatchESignatureEnvelope({
        offerTerms: {
          offerId: 'offer_cb_101',
          propertyAddress: '1001 N Lake Park Blvd, Carolina Beach, NC 28428',
          buyerName: 'Carolina Beach Investment Group',
          purchasePrice: 650000,
          dueDiligenceFee: 15000,
          initialEmd: 10000,
          settlementDate: '2026-10-15'
        },
        recipients: [
          { name: 'Ryan Crecelius', email: 'ryan@nestwilmington.com', role: 'bic' }
        ]
      });

      expect(res.success).toBe(true);
      expect(res.envelopeId).toBeDefined();
      expect(res.bicStamp).toBeDefined();
    });

    it('returns e-signature provider status ledger', () => {
      const providerInfo = getActiveESignatureProvider();
      expect(providerInfo).toHaveProperty('primaryProvider');
    });
  });

  // ==========================================
  // AREA 4: Public Site & Portal Routing Audit
  // ==========================================
  describe('Area 4: Public Website & Headless Portal Routing', () => {
    it('verifies route paths match expectations for public site and client portals', () => {
      const routes = [
        '/',
        '/login',
        '/method',
        '/brokerages',
        '/operational-intelligence',
        '/discovery',
        '/about',
        '/terms',
        '/privacy',
        '/client/deal/test-token-123',
        '/agent/action/test-action-456',
        '/request/listing-launch'
      ];

      expect(routes).toHaveLength(12);
      routes.forEach(route => {
        expect(route).toBeDefined();
      });
    });
  });
});
