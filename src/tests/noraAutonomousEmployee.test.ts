/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Nora Autonomous Employee Integration & Action Execution Test Suite
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import { NoraAutonomousEmployeeService } from '../../server/ai/noraAutonomousEmployeeService.js';
import { noraAutonomousEmployeeRouter } from '../../server/routes/noraAutonomousEmployeeRoute.js';
import { NoraDatabaseGroundingService } from '../../server/ai/noraDatabaseGroundingService.js';
import fs from 'fs';
import path from 'path';

describe('Nora Autonomous Employee Execution & Proactive Sweep Test Suite', () => {
  let server: any;
  let baseUrl: string;

  beforeAll(async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/nora', noraAutonomousEmployeeRouter);

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  describe('1. Nora Autonomous Action Handlers (All 6 Domains)', () => {
    it('retrieves persistent activity log with timestamped execution records', () => {
      const logs = NoraAutonomousEmployeeService.getActivityLog();
      expect(logs).toBeDefined();
      expect(logs.length).toBeGreaterThanOrEqual(4);
      expect(logs[0].status).toBe('completed');
    });

    it('Action 1: dispatches vendor work order to Coastal Sign Post Co and notifies Ann Gunn', async () => {
      const res = await NoraAutonomousEmployeeService.executeDispatchVendorOrder({
        vendorName: 'Coastal Sign Post Co.',
        propertyAddress: '312 Mayfaire Way, Wilmington, NC',
        serviceType: 'Yard Sign Post & Custom Rider Install'
      });

      expect(res.success).toBe(true);
      expect(res.workOrderId).toBeDefined();
      expect(res.summary).toContain('Coastal Sign Post Co.');
      expect(res.log.domain).toBe('operations');
    });

    it('Action 2: launches Maxa browser agent, generates 300 DPI proof package, and stages in Eduardo workspace', async () => {
      const res = await NoraAutonomousEmployeeService.executeGenerateMarketingCollateral({
        propertyAddress: '1104 Arboretum Dr, Wilmington, NC 28405',
        templateType: 'Double-Sided Feature Flyer (8.5x11)',
        assignedTo: 'Eduardo Lovo'
      });

      expect(res.success).toBe(true);
      expect(res.runId).toBeDefined();
      expect(res.proofPdfUrl).toContain('300dpi');
      expect(res.log.domain).toBe('marketing');
    });

    it('Action 3: harvests county deed/PIN records and stages NC Form 2-T into Dotloop loop', async () => {
      const res = await NoraAutonomousEmployeeService.executeDraftAndStageContract({
        propertyAddress: '702 S Lumina Ave, Wrightsville Beach, NC 28480',
        purchasePrice: 1250000,
        dueDiligenceFee: 35000,
        earnestMoneyDeposit: 25000,
        buyerNames: 'Harrison & Caroline Sterling'
      });

      expect(res.success).toBe(true);
      expect(res.loopId).toBeDefined();
      expect(res.harvestData.parcelPin).toBeDefined();
      expect(res.log.domain).toBe('contracts');
    });

    it('Action 4: dispatches 4-point caller follow-up SMS with live tracker link', async () => {
      const res = await NoraAutonomousEmployeeService.executeSendCallerFollowup({
        callerPhone: '+1 (910) 555-8120',
        callerName: 'Sarah Jenkins',
        propertyAddress: '1104 Arboretum Dr',
        actionSummary: 'Collateral package in build with VA Eduardo and sign post dispatched.',
        routedTo: 'Eduardo Lovo & Ann Gunn'
      });

      expect(res.success).toBe(true);
      expect(res.trackerId).toBeDefined();
      expect(res.trackingUrl).toContain('tracker');
      expect(res.log.domain).toBe('telephony');
    });

    it('Action 5: verifies First Bank NC trust deposit and dispatches RPOADS statutory rescission reminder SMS', async () => {
      const res = await NoraAutonomousEmployeeService.executeVerifyTrustDepositAndNudge({
        brokerName: 'Sarah Jenkins',
        propertyAddress: '1104 Arboretum Dr',
        issueType: 'missing_rpoads'
      });

      expect(res.success).toBe(true);
      expect(res.smsMessage).toContain('NCGS § 47E-5');
      expect(res.log.domain).toBe('compliance');
    });

    it('Action 6: executes proactive autonomous heartbeat sweep across 6 domains', async () => {
      const heartbeat = await NoraAutonomousEmployeeService.executeProactiveHeartbeat();

      expect(heartbeat.scannedDomains).toContain('operations');
      expect(heartbeat.scannedDomains).toContain('marketing');
      expect(heartbeat.scannedDomains).toContain('contracts');
      expect(heartbeat.scannedDomains).toContain('compliance');
      expect(heartbeat.actionsTakenCount).toBeGreaterThanOrEqual(1);
      expect(heartbeat.findings.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('2. REST API Routes Integration', () => {
    it('GET /api/nora/activity-log returns recent autonomous action logs', async () => {
      const res = await fetch(`${baseUrl}/api/nora/activity-log`);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.logs.length).toBeGreaterThanOrEqual(4);
    });

    it('POST /api/nora/execute-action triggers autonomous vendor dispatch', async () => {
      const res = await fetch(`${baseUrl}/api/nora/execute-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'dispatch_vendor_order',
          params: {
            vendorName: 'Coastal Sign Post Co.',
            propertyAddress: '312 Mayfaire Way',
            serviceType: 'Sign Post Installation'
          }
        })
      });

      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.result.workOrderId).toBeDefined();
    });

    it('POST /api/nora/run-heartbeat executes full proactive sweep', async () => {
      const res = await fetch(`${baseUrl}/api/nora/run-heartbeat`, {
        method: 'POST'
      });

      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.heartbeat.actionsTakenCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('3. Nora Omnichannel Intelligence Action Grounding', () => {
    it('executes "Nora, dispatch sign post for 312 Mayfaire Way" autonomously', async () => {
      const res = await NoraDatabaseGroundingService.resolveGroundedQuery({
        query: 'Nora, dispatch sign post for 312 Mayfaire Way',
        workspaceId: 'ws_wilmington',
        tenantId: 'tenant_nest_uat'
      });

      expect(res).toBeDefined();
      expect(res?.success).toBe(true);
      expect(res?.spokenAnswer).toContain('dispatched');
      expect(res?.displayResponse).toContain('Autonomous Vendor Work Order Dispatched');
      expect(res?.evidenceCard?.target).toContain('Dispatched');
    });

    it('executes "Nora, generate 300 DPI Maxa flyer for 1104 Arboretum" autonomously', async () => {
      const res = await NoraDatabaseGroundingService.resolveGroundedQuery({
        query: 'Nora, generate 300 DPI Maxa flyer for 1104 Arboretum',
        workspaceId: 'ws_wilmington',
        tenantId: 'tenant_nest_uat'
      });

      expect(res).toBeDefined();
      expect(res?.success).toBe(true);
      expect(res?.spokenAnswer).toContain('Maxa');
      expect(res?.displayResponse).toContain('300 DPI');
      expect(res?.evidenceCard?.target).toContain('300 DPI Proof Staged in VA Hub');
    });

    it('executes "Nora, run a proactive sweep across the brokerage" autonomously', async () => {
      const res = await NoraDatabaseGroundingService.resolveGroundedQuery({
        query: 'Nora, run a proactive sweep across the brokerage',
        workspaceId: 'ws_wilmington',
        tenantId: 'tenant_nest_uat'
      });

      expect(res).toBeDefined();
      expect(res?.success).toBe(true);
      expect(res?.spokenAnswer).toContain('proactive brokerage sweep');
      expect(res?.displayResponse).toContain('Nora Autonomous Proactive Brokerage Sweep');
    });
  });

  describe('4. Frontend UI Component File Integrity', () => {
    it('verifies NoraAutonomousEmployeeHub.tsx exists and renders command bar and activity ledger', () => {
      const hubPath = path.resolve(process.cwd(), 'src/components/voice/NoraAutonomousEmployeeHub.tsx');
      expect(fs.existsSync(hubPath)).toBe(true);

      const content = fs.readFileSync(hubPath, 'utf-8');
      expect(content).toContain('Nora Autonomous Employee Command Hub');
      expect(content).toContain('Command Nora to Execute Any Brokerage Operation');
      expect(content).toContain('1-Click Autonomous Quick Actions');
      expect(content).toContain('Nora Real-Time Autonomous Activity Ledger');
    });
  });
});
