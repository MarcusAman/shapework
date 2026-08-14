import { describe, it, expect } from 'vitest';

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

describe('NC REALTORS® Form 2-T Offer Drafting & BIC Compliance Calculator', () => {
  it('correctly calculates financial ratios for standard 312 Mayfaire Way offer', () => {
    const res = calculateForm2tRatios(725000, 15000, 10000);
    expect(res.ddRatio).toBe(2.07);
    expect(res.emdRatio).toBe(1.38);
    expect(res.totalAtRisk).toBe(3.45);
    expect(res.bicStatus).toBe('PASSED');
  });

  it('triggers a BIC WARNING flag when Due Diligence fee ratio is under 1.0%', () => {
    const res = calculateForm2tRatios(725000, 5000, 10000);
    expect(res.ddRatio).toBe(0.69);
    expect(res.bicStatus).toBe('WARNING');
    expect(res.bicNotes).toContain('below 1.0%');
  });

  it('requires BIC approval for jumbo offers over $1M with lower DD ratio', () => {
    const res = calculateForm2tRatios(1250000, 15000, 20000);
    expect(res.ddRatio).toBe(1.20);
    expect(res.bicStatus).toBe('NEEDS_BIC_APPROVAL');
  });
});
