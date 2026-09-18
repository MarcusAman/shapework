/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * BIC Legal Compliance & Trust Account Sentinel Test Suite
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import { BicComplianceRepository } from '../../server/persistence/bicComplianceRepository.js';
import { bicComplianceRouter } from '../../server/routes/bicComplianceRoute.js';
import { NoraDatabaseGroundingService } from '../../server/ai/noraDatabaseGroundingService.js';
import fs from 'fs';
import path from 'path';

describe('BIC Legal Compliance & Trust Account Sentinel Suite', () => {
  let server: any;
  let baseUrl: string;

  beforeAll(async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/bic', bicComplianceRouter);

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

  describe('1. Repository Compliance Audit & 3-Day Banking Ledger', () => {
    it('returns executive audit summary KPIs for the Broker-in-Charge', () => {
      const summary = BicComplianceRepository.getAuditSummary();
      expect(summary).toBeDefined();
      expect(summary.totalBrokerCount).toBe(72);
      expect(summary.ceCompliantBrokersCount).toBe(58);
      expect(summary.missingDisclosuresCount).toBeGreaterThanOrEqual(2);
    });

    it('retrieves active trust account deposit queue with 3-day banking deadlines', () => {
      const queue = BicComplianceRepository.getTrustAccountQueue();
      expect(queue.length).toBeGreaterThanOrEqual(4);

      const urgent = queue.find(t => t.id === 'esc_1104_arboretum');
      expect(urgent).toBeDefined();
      expect(urgent?.earnestMoneyAmount).toBe(25000);
      expect(urgent?.escrowHolder).toContain('First Bank NC');
      expect(urgent?.status).toBe('urgent_deadline_today');
    });

    it('verifies trust account deposit and timestamps verification by BIC', () => {
      const updated = BicComplianceRepository.verifyTrustDeposit('esc_1104_arboretum', 'Ryan Crecelius (BIC)');
      expect(updated).toBeDefined();
      expect(updated?.status).toBe('deposit_verified');
      expect(updated?.verifiedBy).toContain('Ryan Crecelius');
    });

    it('audits mandatory NC disclosures and flags NCGS § 47E-5 statutory rescission risk', () => {
      const audits = BicComplianceRepository.getDisclosureAudits();
      expect(audits.length).toBeGreaterThanOrEqual(3);

      const flagged = audits.find(d => d.id === 'disc_1104_arboretum');
      expect(flagged).toBeDefined();
      expect(flagged?.statutoryRescissionRisk).toBe(true);
      expect(flagged?.rpoadsStatus).toBe('missing_buyer_signature');
      expect(flagged?.riskSummary).toContain('NCGS § 47E-5');
    });

    it('tracks annual CE course completion status across brokers before June 10', () => {
      const roster = BicComplianceRepository.getCeRoster();
      expect(roster.length).toBeGreaterThanOrEqual(5);

      const ryan = roster.find(b => b.id === 'ce_ryan_crecelius');
      expect(ryan?.isFullyCompliant).toBe(true);

      const urgent = roster.filter(b => b.warningLevel === 'urgent_incomplete');
      expect(urgent.length).toBeGreaterThanOrEqual(2);
    });

    it('dispatches compliance legal nudge SMS to broker', () => {
      const receipt = BicComplianceRepository.dispatchAgentNudge({
        brokerName: 'Sarah Jenkins',
        propertyAddress: '1104 Arboretum Dr',
        issueType: 'missing_rpoads'
      });

      expect(receipt.success).toBe(true);
      expect(receipt.smsMessage).toContain('NCGS § 47E-5');
      expect(receipt.dispatchedTo).toBe('Sarah Jenkins');
    });
  });

  describe('2. REST API Routes Integration', () => {
    it('GET /api/bic/audit-summary returns full audit KPIs', async () => {
      const res = await fetch(`${baseUrl}/api/bic/audit-summary`);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.summary.totalBrokerCount).toBe(72);
    });

    it('GET /api/bic/trust-accounts returns active escrow deposits', async () => {
      const res = await fetch(`${baseUrl}/api/bic/trust-accounts`);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.items.length).toBeGreaterThanOrEqual(4);
    });

    it('GET /api/bic/disclosures returns RPOADS/MOG audit list', async () => {
      const res = await fetch(`${baseUrl}/api/bic/disclosures`);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.audits.length).toBeGreaterThanOrEqual(3);
    });

    it('POST /api/bic/verify-deposit updates deposit status', async () => {
      const res = await fetch(`${baseUrl}/api/bic/verify-deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          depositId: 'esc_702_lumina',
          verifiedBy: 'Ryan Crecelius (BIC)'
        })
      });
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.deposit.status).toBe('deposit_verified');
    });
  });

  describe('3. Nora Omnichannel Grounding for BIC Compliance', () => {
    it('routes "Nora, do we have any pending earnest money deposits violating the 3-day banking rule?" to trust account tool', async () => {
      const res = await NoraDatabaseGroundingService.resolveGroundedQuery({
        query: 'Nora, do we have any pending earnest money deposits violating the 3-day banking rule?',
        workspaceId: 'ws_wilmington',
        tenantId: 'tenant_nest_uat'
      });

      expect(res).toBeDefined();
      expect(res?.success).toBe(true);
      expect(res?.matchedDomain).toBe('compliance');
      expect(res?.spokenAnswer).toContain('Rule 58A .0116');
      expect(res?.spokenAnswer).toContain('3 banking days');
      expect(res?.displayResponse).toContain('Broker-in-Charge NCREC Compliance');
      expect(res?.evidenceCard?.target).toContain('1 Urgent Deposit Expiring Today');
    });

    it('routes "Nora, are there any missing RPOADS disclosures on our pending contracts?" to disclosure auditor', async () => {
      const res = await NoraDatabaseGroundingService.resolveGroundedQuery({
        query: 'Nora, are there any missing RPOADS disclosures on our pending contracts?',
        workspaceId: 'ws_wilmington',
        tenantId: 'tenant_nest_uat'
      });

      expect(res).toBeDefined();
      expect(res?.success).toBe(true);
      expect(res?.matchedDomain).toBe('compliance');
      expect(res?.spokenAnswer).toContain('missing disclosure');
      expect(res?.displayResponse).toContain('NCGS § 47E-5');
    });

    it('routes "Nora, which brokers still need their CE credits before June 10?" to CE roster radar', async () => {
      const res = await NoraDatabaseGroundingService.resolveGroundedQuery({
        query: 'Nora, which brokers still need their CE credits before June 10?',
        workspaceId: 'ws_wilmington',
        tenantId: 'tenant_nest_uat'
      });

      expect(res).toBeDefined();
      expect(res?.success).toBe(true);
      expect(res?.matchedDomain).toBe('compliance');
      expect(res?.spokenAnswer).toContain('58 are fully compliant');
      expect(res?.displayResponse).toContain('NCREC Annual CE & License Renewal Radar');
    });
  });

  describe('4. Frontend UI Component File Integrity', () => {
    it('verifies BicComplianceCommandCenter.tsx exists and renders compliance modules', () => {
      const viewPath = path.resolve(process.cwd(), 'src/components/compliance/BicComplianceCommandCenter.tsx');
      expect(fs.existsSync(viewPath)).toBe(true);

      const content = fs.readFileSync(viewPath, 'utf-8');
      expect(content).toContain('BIC Legal Compliance & Trust Account Sentinel');
      expect(content).toContain('3-Day Banking Rule & Escrow Ledger');
      expect(content).toContain('NC Mandatory Disclosures');
      expect(content).toContain('72-Broker June 10 CE Radar');
    });
  });
});
