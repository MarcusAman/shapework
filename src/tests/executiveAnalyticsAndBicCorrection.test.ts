/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * executiveAnalyticsAndBicCorrection.test.ts
 * Verifies Brokerage BIC leadership roles (Jessica Keenan & Eric Knight),
 * Matt Orr title correction, executive velocity analytics calculations,
 * and statutory NCREC audit certificate generation.
 */

import { describe, it, expect } from 'vitest';
import { executiveAnalyticsEngine } from '../../server/analytics/executiveAnalyticsEngine.js';
import { sopRepository } from '../../server/persistence/sopRepository.js';
import { sopRunRepository } from '../../server/persistence/sopRunRepository.js';

describe('Brokerage Leadership & BIC Role Governance', () => {
  it('correctly designates Jessica Keenan and Eric Knight as BICs in SOP definitions', async () => {
    const sops = await sopRepository.listDrafts('tenant_nest_uat', 'ws_wilmington');
    
    const listingSop = sops.find(s => s.id === 'sop_listing_launch_001');
    const contractSop = sops.find(s => s.id === 'sop_contract_verification_002');
    const buyerSop = sops.find(s => s.id === 'sop_buyer_onboarding_005');

    expect(listingSop).toBeDefined();
    expect(listingSop?.reviewer).toContain('Jessica Keenan');
    expect(listingSop?.publisher).toContain('Jessica Keenan');
    expect(listingSop?.publisher).not.toContain('Matt Orr');

    expect(contractSop).toBeDefined();
    expect(contractSop?.processOwner).toContain('Eric Knight');
    expect(contractSop?.reviewer).toContain('Eric Knight');
    expect(contractSop?.publisher).toContain('Eric Knight');
    expect(contractSop?.publisher).not.toContain('Matt Orr');

    expect(buyerSop).toBeDefined();
    expect(buyerSop?.reviewer).toContain('Jessica Keenan');
    expect(buyerSop?.publisher).toContain('Jessica Keenan');
  });

  it('assigns active Carolina Beach contract checklist runs to BIC Eric Knight', async () => {
    const runs = await sopRunRepository.listRuns('nest-realty-wilmington');
    const carolinaBeachRun = runs.find(r => r.propertyAddress?.includes('804 Carolina Beach'));

    expect(carolinaBeachRun).toBeDefined();
    expect(carolinaBeachRun?.assigneeName).toContain('Eric Knight');
    expect(carolinaBeachRun?.assigneeName).not.toContain('Matt Orr');
    expect(carolinaBeachRun?.assigneeRole).toBe('Broker-in-Charge');
  });
});

describe('Executive BI Analytics Engine', () => {
  it('computes 4-pillar velocity metrics with SLA targets and trends', async () => {
    const data = await executiveAnalyticsEngine.getExecutiveCockpitData('nest-realty-wilmington');

    expect(data).toBeDefined();
    expect(data.brokerageOverview.totalActiveAgents).toBe(74);
    expect(data.brokerageOverview.bicsOnRecord).toHaveLength(2);
    expect(data.brokerageOverview.bicsOnRecord.map(b => b.name)).toEqual(['Jessica Keenan', 'Eric Knight']);

    // Pillar 1: Velocity
    const velocity = data.velocityMetrics;
    expect(velocity.listingLaunchTurnaround.currentValue).toBeLessThanOrEqual(48.0);
    expect(velocity.contractVerificationTurnaround.currentValue).toBeLessThanOrEqual(24.0);
    expect(velocity.onTimeSlaRate.currentValue).toBeGreaterThanOrEqual(95.0);
    expect(velocity.vendorFulfillmentSpeed.currentValue).toBeLessThanOrEqual(24.0);

    // Pillar 2: Bottleneck Heatmap
    expect(data.bottleneckHeatmap.length).toBeGreaterThan(0);
    const criticalBottleneck = data.bottleneckHeatmap.find(b => b.status === 'critical_bottleneck');
    expect(criticalBottleneck).toBeDefined();
    expect(criticalBottleneck?.delayIndex).toBeGreaterThan(1.0);
    expect(criticalBottleneck?.primaryRootCause).toBeTruthy();

    // Pillar 3: Staff Workload
    expect(data.staffWorkload.length).toBe(4);
    const staffNames = data.staffWorkload.map(s => s.name);
    expect(staffNames).toContain('Melissa Gagliardi');
    expect(staffNames).toContain('Ann Gunn');
    expect(staffNames).toContain('Jessica Keenan');
    expect(staffNames).toContain('Eric Knight');

    // Pillar 4: NCREC Compliance
    expect(data.ncrecCompliance.overallScore).toBeGreaterThanOrEqual(95.0);
    expect(data.ncrecCompliance.sampleAuditFiles.length).toBeGreaterThan(0);
  });

  it('generates official NCREC Audit Certificate with statutory seal and BIC signing lines', async () => {
    const report = await executiveAnalyticsEngine.generateNcrecAuditReport('nest-realty-wilmington');

    expect(report.success).toBe(true);
    expect(report.reportId).toMatch(/^NCREC-AUD-2026-\d{4}$/);
    expect(report.brokerageName).toContain('Nest Realty Wilmington');
    expect(report.brokerOwner).toBe('Ryan Crecelius');
    expect(report.designatedBics).toHaveLength(2);
    expect(report.designatedBics.map(b => b.name)).toEqual(['Jessica Keenan', 'Eric Knight']);
    expect(report.summaryStats.wwreaCompliance).toBe('100.0%');
    expect(report.summaryStats.form2tExecutionAudit).toBe('100.0%');
    expect(report.verificationSeal).toContain('OFFICIALLY VERIFIED');
  });
});
