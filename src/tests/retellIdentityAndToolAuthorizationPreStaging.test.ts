/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Retell Identity & Tool Authorization Pre-Staging Verification Suite
 * Proves:
 * 1. Email identity queries the canonical active Directory repository.
 * 2. Static seed fallback CANNOT authenticate a production sender (fail-closed).
 * 3. DMARC failure creates an isolated draft (cannot access or modify other brokers' tasks).
 * 4. Retell phone identity cannot schedule a meeting (backend blocks with 403).
 * 5. Retell phone identity cannot access another broker's tasks (caller task isolation).
 * 6. Sign requests create only internal review records (no vendor contact, no $65 charge, no scheduling promise).
 * 7. Backend enforces all restrictions independently of the LLM prompt.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import http from 'http';
import { retellToolsRouter } from '../../server/routes/retellToolsRoute';
import { ingestInboundEmailToTask } from '../../server/services/inboundEmailIngestionEngine';
import { 
  getActiveDirectoryMemberByEmail, 
  getActiveDirectoryMemberByPhone,
  isAdministrativeStaffOrBic
} from '../../server/services/canonicalDirectoryService';
import { 
  saveCanonicalMarketingRequest, 
  saveCanonicalMarketingTask,
  getAllCanonicalMarketingRequests,
  getAllCanonicalMarketingTasks
} from '../../server/persistence/marketingCampaignsRepository';

describe('Pre-Staging Identity & Retell Tool Authorization Suite', () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/retell/tools', retellToolsRouter);

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr: any = server.address();
        baseUrl = `http://localhost:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  describe('1. Canonical Directory & Email Authentication Gate', () => {
    it('1. Email identity queries active directory member successfully in test/dev', async () => {
      const member = await getActiveDirectoryMemberByEmail('matt.orr@nestrealty.com', 'ws_wilmington');
      expect(member).not.toBeNull();
      expect(member?.name).toBe('Matt Orr');
      expect(member?.status).toBe('active');
    });

    it('2. Static seed fallback CANNOT authenticate a production sender (fail-closed)', async () => {
      const prevEnv = process.env.NODE_ENV;
      const prevAppEnv = process.env.APP_ENV;
      try {
        process.env.NODE_ENV = 'production';
        process.env.APP_ENV = 'production';

        // In production without database connection, static fallback MUST NOT authenticate
        const prodMember = await getActiveDirectoryMemberByEmail('matt.orr@nestrealty.com', 'ws_wilmington');
        expect(prodMember).toBeNull();
      } finally {
        process.env.NODE_ENV = prevEnv;
        process.env.APP_ENV = prevAppEnv;
      }
    });

    it('3. DMARC failure creates an isolated draft and cannot modify existing broker requests', async () => {
      // Step A: Seed an existing broker request for 500 Market St
      const initialRequest = {
        id: 'req_existing_broker_500',
        workspaceId: 'ws_wilmington',
        title: '500 Market St • Marketing Package',
        propertyAddress: '500 Market St, Wilmington, NC 28401',
        agentName: 'Matt Orr',
        agentEmail: 'matt.orr@nestrealty.com',
        channel: 'web' as const,
        status: 'needs_info' as const,
        taskIds: ['tsk_500_flyer'],
        photos: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      saveCanonicalMarketingRequest(initialRequest);

      // Step B: Inbound email claiming to be from Matt Orr but DMARC fails
      const spoofEmailPayload = {
        workspaceId: 'ws_wilmington',
        from: 'Matt Orr <matt.orr@nestrealty.com>',
        to: 'AskNora@nestrealty.com',
        subject: 'Re: 500 Market St photos',
        textContent: 'Here are malicious photos for 500 Market St.',
        rawAttachments: [
          { filename: 'spoofed_photo.jpg', contentType: 'image/jpeg', sizeBytes: 1024, url: '/uploads/spoofed.jpg' }
        ],
        authResults: {
          dmarc: 'fail (p=reject)',
          dmarcPass: false,
          spf: 'fail',
          dkim: 'fail'
        }
      };

      const result = await ingestInboundEmailToTask(spoofEmailPayload);
      expect(result.success).toBe(true);
      // Unverified sender MUST NOT reconcile into Matt Orr's existing request
      expect(result.actionTaken).not.toBe('reconciled_updated');
      expect(result.requestId).not.toBe('req_existing_broker_500');

      // Verify the existing broker request remains unmodified
      const allRequests = getAllCanonicalMarketingRequests();
      const targetReq = allRequests.find(r => r.id === 'req_existing_broker_500');
      expect(targetReq?.photos?.length).toBe(0);
    });

    it('4. SPF or DKIM alone without DMARC pass is insufficient', async () => {
      const spfOnlyPayload = {
        workspaceId: 'ws_wilmington',
        from: 'Matt Orr <matt.orr@nestrealty.com>',
        to: 'AskNora@nestrealty.com',
        subject: 'Marketing intake for 770 Pine Valley Dr',
        textContent: 'Please create flyer for 770 Pine Valley Dr.',
        authResults: {
          spf: 'pass',
          dkim: 'none',
          dmarc: 'fail' // DMARC fail overrides SPF
        }
      };

      const result = await ingestInboundEmailToTask(spfOnlyPayload);
      expect(result.actionTaken).not.toBe('reconciled_updated');
    });
  });

  describe('2. Retell Telephony Authorization Restrictions', () => {
    it('5. Retell phone identity CANNOT schedule a meeting (rejected with HTTP 403)', async () => {
      const response = await fetch(`${baseUrl}/api/retell/tools/schedule-meeting`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Brokerage All-Hands Meeting',
          meetingDate: '2026-09-10',
          startTime: '10:00 AM',
          callerPhone: '+19106128283',
          callerName: 'Matt Orr'
        })
      });

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('UNAUTHORIZED_CALENDAR_ACTION');
      expect(body.message).toContain('requires an authenticated session');
    });

    it('6. Retell phone identity CANNOT access another broker\'s open tasks', async () => {
      // Seed task for Sarah Jenkins
      const sarahTask = {
        id: 'tsk_sarah_1104',
        requestId: 'req_sarah_1104',
        workspaceId: 'ws_wilmington',
        requestTitle: '1199 Arboretum Park Way • Marketing Package',
        propertyAddress: '1199 Arboretum Park Way, Wilmington, NC 28405',
        agentName: 'Sarah Jenkins',
        agentEmail: 'sarah.jenkins@nestrealty.com',
        title: 'Luxury Property Flyer',
        category: 'marketing_collateral' as const,
        assignedTo: 'Eduardo Lovo',
        status: 'ready_for_review' as const,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      saveCanonicalMarketingTask(sarahTask);

      // Caller is Matt Orr (+19106128283) querying Sarah Jenkins' property
      const response = await fetch(`${baseUrl}/api/retell/tools/lookup-open-tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: '1199 Arboretum Park Way, Wilmington, NC',
          callerPhone: '+19106128283' // Matt Orr
        })
      });

      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body.has_open_tasks).toBe(false);
      expect(body.tasks.length).toBe(0);
      expect(body.summary).toContain('No open tasks for your account were found');
    });

    it('7. Phone-matched BIC (Ryan Crecelius) CANNOT access another broker\'s tasks over phone (NO phone-based admin elevation)', async () => {
      // Caller is Ryan Crecelius (+19104097120 - BIC / Owner) querying Sarah Jenkins' property
      // Under identified_unauthenticated telephony assurance, cross-broker elevation is strictly forbidden.
      const response = await fetch(`${baseUrl}/api/retell/tools/lookup-open-tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: '1199 Arboretum Park Way, Wilmington, NC',
          callerPhone: '+19104097120' // Ryan Crecelius
        })
      });

      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body.has_open_tasks).toBe(false);
      expect(body.tasks.length).toBe(0);
      expect(body.summary).toContain('No open tasks for your account were found');
    });

    it('8. Roster lookup returns non-sensitive public info and strips personal phone/email', async () => {
      const response = await fetch(`${baseUrl}/api/retell/tools/lookup-roster`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'Matt Orr' })
      });

      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.person.name).toBe('Matt Orr');
      expect(body.person.officePhone).toBe('(910) 507-2047');
      // Personal private cell phone (+19106128283) and database IDs MUST NOT be exposed
      expect(body.person.phone).not.toBe('+19106128283');
      expect(body.person.id).toBeUndefined();
    });

    it('9. Sign post requests create ONLY internal review records (no vendor contact, payment, or scheduling promise)', async () => {
      const response = await fetch(`${baseUrl}/api/retell/tools/dispatch-sign-post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: '422 Wrightsville Ave, Wilmington NC',
          riderText: 'Waterfront Living',
          callerPhone: '+19106128283'
        })
      });

      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.status).toBe('ready_for_review');
      expect(body.isDispatchedToVendor).toBe(false);
      expect(body.vendorOrderPlaced).toBe(false);
      expect(body.cost).toBeUndefined(); // Does NOT charge or promise $65
      expect(body.summary).toContain('internal operations review by Ann Gunn');
      expect(body.summary).toContain('No vendor order has been placed');
    });

    it('10. Unknown caller cannot access internal SOPs/SLAs, while recognized directory caller can', async () => {
      // Step A: Unknown caller querying internal SOP-MKT-003
      const unknownRes = await fetch(`${baseUrl}/api/retell/tools/lookup-sop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sopCode: 'SOP-MKT-003',
          callerPhone: '+19195559999' // Unknown caller
        })
      });

      const unknownBody = await unknownRes.json();
      expect(unknownRes.status).toBe(200);
      expect(unknownBody.accessRestricted).toBe(true);
      expect(unknownBody.summary).toContain('require an active Nest directory match');

      // Step B: Recognized directory broker querying internal SOP-MKT-003
      const knownRes = await fetch(`${baseUrl}/api/retell/tools/lookup-sop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sopCode: 'SOP-MKT-003',
          callerPhone: '+19106128283' // Matt Orr
        })
      });

      const knownBody = await knownRes.json();
      expect(knownRes.status).toBe(200);
      expect(knownBody.sopCode).toBe('SOP-MKT-003');
      expect(knownBody.owner).toBe('Eduardo Lovo');
      expect(knownBody.sla).toBe('4 Hours');
    });

    it('11. Inbound email with spoofed To header but untrusted OAuth mailbox connection fails 3-Point Email Identity Gate', async () => {
      const spoofedMailboxPayload = {
        workspaceId: 'ws_wilmington',
        mailboxId: 'personal-attacker@gmail.com', // Untrusted OAuth connection
        from: 'Matt Orr <matt.orr@nestrealty.com>',
        to: 'AskNora@nestrealty.com', // Spoofed header
        subject: 'Spoofed intake for 100 Main St',
        textContent: 'Malicious intake payload',
        authResults: {
          dmarc: 'pass',
          dmarcPass: true
        }
      };

      const result = await ingestInboundEmailToTask(spoofedMailboxPayload);
      expect(result.success).toBe(true);
      // Untrusted mailbox connection MUST NOT reconcile or produce verified task
      expect(result.actionTaken).not.toBe('reconciled_updated');
    });
  });
});
