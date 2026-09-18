/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Retell Voice & Telephony Inbound Integration Test Suite
 * Validates that:
 * 1. Telephony tools (roster lookup by name/phone, property check, Maxa dispatch, sign post dispatch, DD calculator) execute cleanly.
 * 2. Caller ID reverse-matching accurately resolves brokers from the 72-member roster.
 * 3. In-call dispatches create canonical requests & tasks in the production repository without demo fallback leakage.
 * 4. NC Form 2-T Due Diligence 5:00 PM EST time-of-essence calculations are strictly accurate.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import express, { Express } from 'express';
import type { Server } from 'http';
import { retellToolsRouter } from '../../server/routes/retellToolsRoute.js';
import {
  getAllCanonicalMarketingRequests,
  getAllCanonicalMarketingTasks,
  resetCanonicalStoreForTesting
} from '../../server/persistence/marketingCampaignsRepository.js';
import { isMarketingTask, isOperationalTask } from '../components/marketing/MarketingHomeInbox.js';

describe('Retell Telephony Voice Tools & Inbound Sync Suite', () => {
  let app: Express;
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    app = express();
    app.use((req, _res, next) => {
      req.headers['x-test-auth-bypass'] = 'true';
      next();
    });
    app.use(express.json());
    app.use('/api/retell/tools', retellToolsRouter);

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

  beforeEach(() => {
    resetCanonicalStoreForTesting();
  });

  describe('1. Roster Lookup & Caller ID Reverse Matching', () => {
    it('accurately resolves broker profile by full name', async () => {
      const res = await fetch(`${baseUrl}/api/retell/tools/lookup-roster`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'Matt Orr' })
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.resultType).toBe('person_profile');
      expect(data.person.name).toBe('Matt Orr');
      expect(data.person.office).toContain('Mayfaire');
    });

    it('accurately reverse-matches broker by incoming caller phone digits', async () => {
      const res = await fetch(`${baseUrl}/api/retell/tools/lookup-roster`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '9106128283' })
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.person.name).toBe('Matt Orr');
    });

    it('returns BIC leadership directory when queried about BIC / compliance oversight', async () => {
      const res = await fetch(`${baseUrl}/api/retell/tools/lookup-roster`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'Who is the broker in charge?' })
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.resultType).toBe('bic_leadership');
      expect(data.bics.some((b: any) => b.name === 'Ryan Crecelius')).toBe(true);
      expect(data.bics.some((b: any) => b.name === 'Matt Orr')).toBe(true);
    });
  });

  describe('2. In-Call Marketing & Operational Dispatches', () => {
    it('dispatches Maxa marketing collateral and pushes directly to canonical requests table', async () => {
      const res = await fetch(`${baseUrl}/api/retell/tools/dispatch-marketing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: '415 South Live Oak Pkwy',
          packageType: 'Luxury Waterfront Launch Suite',
          agentName: 'Jessica Keenan',
          price: '$1,850,000',
          bedsBaths: '4 Beds / 4.5 Baths'
        })
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.runId).toBeDefined();

      // Verify canonical request creation
      const requests = getAllCanonicalMarketingRequests();
      const match = requests.find(r => r.propertyAddress?.includes('415 South Live Oak'));
      expect(match).toBeDefined();
      expect(match?.agentName).toBe('Jessica Keenan');

      // Verify child tasks
      const tasks = getAllCanonicalMarketingTasks();
      const propertyTasks = tasks.filter(t => t.propertyAddress?.includes('415 South Live Oak'));
      expect(propertyTasks.length).toBeGreaterThan(0);
      expect(isMarketingTask(propertyTasks[0])).toBe(true);
    });

    it('dispatches Coastal Sign Post work order and categorizes as Operational Task', async () => {
      const res = await fetch(`${baseUrl}/api/retell/tools/dispatch-sign-post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: '228 Wrightsville Ave',
          riderText: 'Under Contract / Coming Soon',
          callerPhone: '(910) 555-0144'
        })
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.ticketId).toBeDefined();
      expect(data.vendor).toBe('Coastal Sign Post Co.');

      // Verify canonical task
      const tasks = getAllCanonicalMarketingTasks();
      const signTask = tasks.find(t => t.propertyAddress?.includes('228 Wrightsville Ave'));
      expect(signTask).toBeDefined();
      if (signTask) {
        expect(isOperationalTask(signTask)).toBe(true);
        expect(isMarketingTask(signTask)).toBe(false);
      }
    });
  });

  describe('3. NC Form 2-T Due Diligence & Escrow Calculator', () => {
    it('accurately calculates 14-day Due Diligence expiration at 5:00 PM Eastern Time from explicit contract inputs', async () => {
      const res = await fetch(`${baseUrl}/api/retell/tools/calculate-due-diligence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          effectiveDate: '2026-09-01T12:00:00Z',
          dueDiligenceDays: 14
        })
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.schedule.dueDiligenceExpiration).toContain('5:00 PM Eastern Time');
      expect(data.schedule.dueDiligenceExpiration).toContain('Sep 15, 2026');
      expect(data.schedule.governingRule).toContain('NC Form 2-T Paragraph 1(j)');
    });

    it('rejects missing contract inputs with 400 Bad Request to prevent inventing terms', async () => {
      const res = await fetch(`${baseUrl}/api/retell/tools/calculate-due-diligence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Explicit effectiveDate');
    });
  });

  describe('4. SOP Governance & RBAC', () => {
    it('enforces authorized admin governance rules for SOP deletion', async () => {
      const res = await fetch(`${baseUrl}/api/retell/tools/lookup-sop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sopCode: 'delete permission rules' })
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.authorizedAdmins).toEqual(['Ryan Crecelius', 'Marcus Aman', 'Matt Orr']);
      expect(data.authorizedAdmins).not.toContain('Adam');
    });
  });

  describe('5. Live Tasks Query Tool & Knowledge Library Search', () => {
    it('queries open tasks for Matt Orr across the brokerage', async () => {
      // Dispatch a marketing request first
      await fetch(`${baseUrl}/api/retell/tools/dispatch-marketing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: '123 Test Avenue, Wilmington NC',
          agentName: 'Matt Orr',
          packageType: 'Luxury Collateral Suite'
        })
      });

      const res = await fetch(`${baseUrl}/api/retell/tools/get-tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentName: 'Matt Orr' })
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.count).toBeGreaterThan(0);
      expect(data.summary).toContain('123 Test Avenue');
    });

    it('searches knowledge library and SOPs for marketing and operations protocols', async () => {
      const res = await fetch(`${baseUrl}/api/retell/tools/search-knowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'maxa' })
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.summary).toContain('SOP-MKT-003');
    });
  });
});
