/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Nora Contract Anomaly & NC Form 2-T Risk Sentinel Test Suite
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import { NoraContractSentinelRepository, SAMPLE_NC_CONTRACTS } from '../../server/persistence/noraContractSentinelRepository.js';
import { noraContractSentinelRouter } from '../../server/routes/noraContractSentinelRoute.js';
import fs from 'fs';
import path from 'path';

describe('Nora Contract Anomaly & NC Form 2-T Risk Sentinel Suite', () => {
  let server: any;
  let baseUrl: string;

  beforeAll(async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/nora/contract-sentinel', noraContractSentinelRouter);

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

  describe('1. NC Form 2-T Legal Anomaly Detection Logic', () => {
    it('accurately audits a clean luxury contract and gives a high safety score', () => {
      const cleanPayload = SAMPLE_NC_CONTRACTS[0].payload;
      const report = NoraContractSentinelRepository.inspectContract(cleanPayload);

      expect(report.overallSafetyScore).toBeGreaterThanOrEqual(85);
      expect(report.riskSummary.criticalCount).toBe(0);
      expect(report.timelineAudit.isDdpAdequateForFinancing).toBe(true);
      expect(report.anomalies.some(a => a.id === 'anom_escrow_verified')).toBe(true);
    });

    it('flags dangerous 10-day DDP on jumbo financing as a critical anomaly', () => {
      const highRiskPayload = SAMPLE_NC_CONTRACTS[1].payload;
      const report = NoraContractSentinelRepository.inspectContract(highRiskPayload);

      expect(report.overallSafetyScore).toBeLessThan(65);
      expect(report.riskSummary.criticalCount).toBeGreaterThanOrEqual(2);

      const jumboDdpAnom = report.anomalies.find(a => a.id === 'anom_ddp_jumbo_mismatch');
      expect(jumboDdpAnom).toBeDefined();
      expect(jumboDdpAnom?.severity).toBe('critical');
      expect(jumboDdpAnom?.remediationClause).toContain('Form 2A11-T');
    });

    it('flags missing coastal CAMA permit disclosure and undefined escrow agent', () => {
      const highRiskPayload = SAMPLE_NC_CONTRACTS[1].payload;
      const report = NoraContractSentinelRepository.inspectContract(highRiskPayload);

      const camaAnom = report.anomalies.find(a => a.id === 'anom_cama_missing');
      const escrowAnom = report.anomalies.find(a => a.id === 'anom_escrow_undefined');

      expect(camaAnom).toBeDefined();
      expect(camaAnom?.severity).toBe('critical');
      expect(escrowAnom).toBeDefined();
      expect(escrowAnom?.severity).toBe('critical');
    });

    it('generates Form 2A11-T recommended remediation clauses', () => {
      const highRiskPayload = SAMPLE_NC_CONTRACTS[1].payload;
      const report = NoraContractSentinelRepository.inspectContract(highRiskPayload);

      expect(report.recommendedAddenda.length).toBeGreaterThanOrEqual(2);
      expect(report.recommendedAddenda.some(c => c.includes('Due Diligence Period'))).toBe(true);
    });
  });

  describe('2. REST API Endpoints', () => {
    it('GET /api/nora/contract-sentinel/samples returns pre-loaded sample scenarios', async () => {
      const res = await fetch(`${baseUrl}/api/nora/contract-sentinel/samples`);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.samples.length).toBeGreaterThanOrEqual(3);
    });

    it('POST /api/nora/contract-sentinel/scan audits contract payload and returns report', async () => {
      const res = await fetch(`${baseUrl}/api/nora/contract-sentinel/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(SAMPLE_NC_CONTRACTS[0].payload)
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.report.overallSafetyScore).toBeGreaterThanOrEqual(85);
      expect(body.report.timelineAudit.dueDiligenceExpirationDate).toContain('5:00 PM EST');
    });
  });

  describe('3. Frontend Component File Integrity', () => {
    it('verifies NoraContractSentinelView exists and contains audit dashboard elements', () => {
      const viewPath = path.resolve(process.cwd(), 'src/components/nora/NoraContractSentinelView.tsx');
      expect(fs.existsSync(viewPath)).toBe(true);

      const content = fs.readFileSync(viewPath, 'utf-8');
      expect(content).toContain('Nora Contract Anomaly & Due Diligence Sentinel');
      expect(content).toContain('NC Form 2-T Critical Timeline Audit');
      expect(content).toContain('Legal Anomalies & Sentinel Findings');
      expect(content).toContain('Recommended Form 2A11-T Remediation Clause');
    });
  });
});
