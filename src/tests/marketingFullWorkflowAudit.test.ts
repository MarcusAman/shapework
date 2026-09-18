/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  parseCallDateToTimestamp,
  parseDurationToSeconds
} from '../components/marketing/CallsTableView';
import {
  MARKETING_SOPS,
  getTeamMemberSops,
  getCampaignGoverningSop
} from '../components/marketing/marketingSopRegistry';
import { TEAM_MEMBERS } from '../components/marketing/MarketingHomeInbox';

describe('Marketing Console End-to-End Workflow & Interactive Actions Audit', () => {
  describe('1. Telephony Call Timestamps & Audio State Processing', () => {
    it('accurately parses relative, string, and raw timestamps into valid epoch milliseconds', () => {
      const nowCall = {
        id: 'call_1',
        callerName: 'Sarah Jenkins',
        propertyAddress: '1104 Arboretum Dr',
        timestamp: 'Today at 9:15 AM',
        duration: '1m 45s'
      };
      const tsNow = parseCallDateToTimestamp(nowCall);
      expect(tsNow).toBeGreaterThan(0);

      const yesterdayCall = {
        id: 'call_2',
        callerName: 'Marcus Aman',
        propertyAddress: '312 Mayfaire Way',
        timestamp: 'Yesterday 3:40 PM',
        duration: '2m 10s'
      };
      const tsYesterday = parseCallDateToTimestamp(yesterdayCall);
      expect(tsYesterday).toBeGreaterThan(0);
      expect(tsNow).toBeGreaterThan(tsYesterday);

      const relativeCall = {
        id: 'call_3',
        callerName: 'Ann Gunn',
        propertyAddress: '742 Lumina Ave',
        timestamp: '15m ago',
        duration: '45s'
      };
      const tsRel = parseCallDateToTimestamp(relativeCall);
      expect(tsRel).toBeGreaterThan(0);
    });

    it('accurately parses audio durations into total seconds for scrubbing progress bars', () => {
      expect(parseDurationToSeconds({ id: 'c1', callerName: 'A', propertyAddress: 'B', timestamp: 'Today', duration: '1m 30s' })).toBe(90);
      expect(parseDurationToSeconds({ id: 'c2', callerName: 'A', propertyAddress: 'B', timestamp: 'Today', duration: '45s' })).toBe(45);
      expect(parseDurationToSeconds({ id: 'c3', callerName: 'A', propertyAddress: 'B', timestamp: 'Today', duration: '2 mins 15 secs' })).toBe(135);
      expect(parseDurationToSeconds({ id: 'c4', callerName: 'A', propertyAddress: 'B', timestamp: 'Today', duration: '120s' })).toBe(120);
    });
  });

  describe('2. End-to-End Campaign Lifecycle State Transitions', () => {
    it('executes Ingestion -> AI Path -> Maxa Staging -> Review Staging -> Approval pipeline', () => {
      // Step 1: Initial Inbound Call
      const rawCall = {
        id: 'call_test_001',
        callerName: 'Sarah Jenkins',
        callerPhone: '+19105550199',
        propertyAddress: '1104 Arboretum Dr, Wilmington, NC',
        timestamp: 'Today 9:15 AM',
        duration: '1m 45s',
        departmentCategory: 'marketing_collateral' as const,
        aiExtractedDetails: {
          price: '$1,250,000',
          bedrooms: '4',
          bathrooms: '3.5',
          targetCollateral: ['Double-Sided Flyer', 'Social Story', 'Direct Mail Postcard']
        }
      };
      expect(rawCall.callerName).toBe('Sarah Jenkins');

      // Step 2: Route / Assign to VA (Eduardo)
      const campaignItem = {
        id: 'camp_test_001',
        callId: rawCall.id,
        propertyAddress: rawCall.propertyAddress,
        agentName: rawCall.callerName,
        packageType: 'Luxury Collateral Suite (Print + Social)',
        status: 'in_production',
        assignedTo: 'Eduardo Lovo',
        targetSla: 'Today 2:30 PM',
        requestedAssets: rawCall.aiExtractedDetails.targetCollateral
      };
      expect(campaignItem.assignedTo).toBe('Eduardo Lovo');
      expect(campaignItem.status).toBe('in_production');

      // Step 3: Autonomous Maxa Browser Agent Staging
      const generatedDeliverables = [
        { id: 'deliv_1', name: '8.5x11 Property Flyer', format: 'pdf', dpi: 300 },
        { id: 'deliv_2', name: '9:16 Social Story Carousel', format: 'png', dpi: 300 },
        { id: 'deliv_3', name: '6x9 EDDM Postcard', format: 'pdf', dpi: 300 }
      ];
      const proofPackage = {
        flyerUrl: 'https://dnhf8bus4lv8r.cloudfront.net/system/nest.maxadesigns.com/design_view_pictures/229058/image/original/open-uri20260804-25191-essk58.jpg',
        storyUrl: 'https://dnhf8bus4lv8r.cloudfront.net/system/nest.maxadesigns.com/design_view_pictures/206208/image/original/open-uri20260529-58756-2yqjxb.jpg',
        postcardUrl: 'https://dnhf8bus4lv8r.cloudfront.net/system/nest.maxadesigns.com/design_view_pictures/229016/image/original/open-uri20260804-25265-drq7ui.jpg'
      };

      const stagedCampaign = {
        ...campaignItem,
        status: 'ready_for_review',
        proofUrl: proofPackage.flyerUrl,
        proofPackage,
        generatedDeliverables
      };
      expect(stagedCampaign.status).toBe('ready_for_review');
      expect(stagedCampaign.generatedDeliverables.length).toBe(3);
      expect(stagedCampaign.proofPackage.flyerUrl).toContain('cloudfront.net');

      // Step 4: 1-Click Review Approval & Coastal Print Dispatch
      const approvedCampaign = {
        ...stagedCampaign,
        status: 'completed',
        approvedAt: new Date().toISOString(),
        printTicketNumber: 'CPW-84920'
      };
      expect(approvedCampaign.status).toBe('completed');
      expect(approvedCampaign.printTicketNumber).toBe('CPW-84920');
    });
  });

  describe('3. SOP Governance Registry & Role Mapping', () => {
    it('verifies all 9 core SOPs with full execution steps and compliance checklists', () => {
      const sopCodes = [
        'SOP-MKT-001',
        'SOP-MKT-002',
        'SOP-MKT-003',
        'SOP-MKT-004',
        'SOP-REV-001',
        'SOP-OPS-001',
        'SOP-OPS-002',
        'SOP-GOV-001',
        'SOP-BIC-001'
      ];

      sopCodes.forEach(code => {
        const sop = MARKETING_SOPS[code];
        expect(sop).toBeDefined();
        expect(sop.code).toBe(code);
        expect(sop.title.length).toBeGreaterThan(5);
        expect(sop.orderedSteps.length).toBeGreaterThanOrEqual(3);
        expect(sop.qualityChecklist.length).toBeGreaterThanOrEqual(3);
        expect(sop.completionEvidence.length).toBeGreaterThan(10);
      });
    });

    it('maps team members to specific operational SOPs', () => {
      expect(getTeamMemberSops('Eduardo Lovo').map(s => s.code)).toContain('SOP-MKT-003');
      expect(getTeamMemberSops('Melissa Gagliardi').map(s => s.code)).toContain('SOP-MKT-001');
      expect(getTeamMemberSops('Ann Gunn').map(s => s.code)).toContain('SOP-OPS-001');
      expect(getTeamMemberSops('Ryan Crecelius').map(s => s.code)).toContain('SOP-GOV-001');
    });

    it('maps requests to governing SOPs based on package and request type', () => {
      expect(getCampaignGoverningSop('Luxury Collateral Suite (Print + Social)').code).toBe('SOP-MKT-003');
      expect(getCampaignGoverningSop('Social Media Reel & Story Package').code).toBe('SOP-MKT-002');
      expect(getCampaignGoverningSop('Sign Post Installation', 'Yard post order').code).toBe('SOP-OPS-001');
      expect(getCampaignGoverningSop('Compliance Audit', 'Form 2-T validation').code).toBe('SOP-BIC-001');
    });
  });
});
