/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Test Suite: Marketing Value Expansion — All 4 Layers
 * 1. Layer 1: Autonomous MLS Photo Fetcher -> Maxa Pre-Drafting Pipeline
 * 2. Layer 2: Interactive Mobile Proof Portal (/proof/:token)
 * 3. Layer 3: Field Vendor Install Photo Verification (/vendor/install/:orderId)
 * 4. Layer 4: Marketing Velocity & Spend-to-GCI Analytics Dashboard
 */

import { describe, it, expect } from 'vitest';
import { MlsPhotoFetcherService } from '../../server/services/mlsPhotoFetcherService';
import {
  getProofPortalDataByToken,
  processProofPortalAction,
  getBrokerageMarketingRoiMetrics
} from '../../server/persistence/marketingCampaignsRepository';
import { vendorOrderRepository } from '../../server/persistence/vendorOrderRepository';

describe('Marketing Value Expansion — All 4 Layers Test Suite', () => {

  describe('1. Layer 1: Autonomous MLS Photo Fetcher & Maxa Pre-Drafting Pipeline', () => {
    it('fetches high-resolution photos and executes autonomous Maxa pipeline staging 300 DPI proofs', async () => {
      const result = await MlsPhotoFetcherService.executeAutonomousPipeline({
        propertyAddress: '304 Ocean Blvd, Wrightsville Beach, NC 28480',
        agentName: 'Sarah Jenkins',
        category: 'listing_launch'
      });

      expect(result.propertyDetails).toBeDefined();
      expect(result.propertyDetails.photos.length).toBeGreaterThanOrEqual(4);
      expect(result.propertyDetails.photos[0].dpi).toBe(300);
      expect(result.propertyDetails.price).toBe('$2,450,000');

      // Maxa run checks
      expect(result.maxaRun).toBeDefined();
      expect(result.maxaRun.status).toBe('staged_in_va');
      expect(result.maxaRun.generatedDeliverables.length).toBeGreaterThanOrEqual(3);

      // Verify request & child tasks created in 'request_received'
      expect(result.request).toBeDefined();
      expect(result.tasks.length).toBe(3);
      expect(result.tasks.every(t => t.status === 'request_received')).toBe(true);
    });
  });

  describe('2. Layer 2: Interactive Mobile Proof Portal (/proof/:token)', () => {
    it('retrieves full-bleed 300 DPI proof package by token', () => {
      const portalData = getProofPortalDataByToken('trk_1104_arboretum');

      expect(portalData.token).toBe('trk_1104_arboretum');
      expect(portalData.deliverables.length).toBe(3);
      expect(portalData.deliverables[0].dpi).toBe(300);
      expect(portalData.deliverables[0].specs).toContain('300 DPI');
    });

    it('processes 1-tap "approve" action and updates task status to approved', () => {
      const { success, data } = processProofPortalAction('trk_1104_arboretum', 'approve', {
        performedBy: 'Sarah Jenkins'
      });

      expect(success).toBe(true);
      expect(data.status).toBe('approved');
    });

    it('processes "request_changes" action with notes and updates task status to revisions', () => {
      const { success, data } = processProofPortalAction('trk_1104_arboretum', 'request_changes', {
        selectedChanges: ['Swap Photo #1 (Front Exterior)', 'Update List Price'],
        note: 'Please use the sunset drone shot for the hero photo.',
        performedBy: 'Sarah Jenkins'
      });

      expect(success).toBe(true);
      expect(data.status).toBe('revisions');
    });
  });

  describe('3. Layer 3: Field Vendor Install Photo Verification (/vendor/install/:orderId)', () => {
    it('uploads on-site installer photo and transitions work order to completed', async () => {
      const orderId = 'ord_sign_001';
      const photoUrl = 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=90';

      const result = await vendorOrderRepository.submitInstallPhotoProof(orderId, photoUrl, {
        notes: 'Colonial vinyl post installed in front lawn per property line flags.',
        installerName: 'Jake Roberts (Coastal Sign Post)',
        gps: '34.2085° N, 77.8012° W'
      });

      expect(result.success).toBe(true);
      expect(result.order).toBeDefined();
      expect(result.order?.status).toBe('completed');
      expect(result.order?.details?.installedPhotoUrl).toBe(photoUrl);
      expect(result.order?.details?.gpsCoordinates).toContain('34.2085° N');
    });
  });

  describe('4. Layer 4: Marketing Velocity & Spend-to-GCI Analytics Dashboard', () => {
    it('derives turnaround velocity, vendor spend, and influenced GCI metrics', () => {
      const metrics = getBrokerageMarketingRoiMetrics();

      expect(metrics.executiveSummary).toBeDefined();
      expect(metrics.executiveSummary.roasMultiplier).toBe(21.8);
      expect(metrics.executiveSummary.influencedCommissionGci).toBe(184200);

      // Velocity metrics
      expect(metrics.velocityAndTurnaround).toBeDefined();
      expect(metrics.velocityAndTurnaround.avgHoursToApproval).toBe(18.4);
      expect(metrics.velocityAndTurnaround.slaComplianceRatePercent).toBe(96.2);

      // Vendor spend distribution
      expect(metrics.vendorSpendSummary).toBeDefined();
      expect(metrics.vendorSpendSummary.length).toBe(4);
      expect(metrics.vendorSpendSummary.some((v: any) => v.vendor.includes('Coastal Sign Post'))).toBe(true);
      expect(metrics.vendorSpendSummary.some((v: any) => v.vendor.includes('FastSigns'))).toBe(true);
    });
  });
});
