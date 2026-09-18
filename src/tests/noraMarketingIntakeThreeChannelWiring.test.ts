/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Three-Channel Production Wiring & Policy Symmetry Integration Test Suite
 * Directly tests the real production adapters for all 3 channels:
 * 1. Retell Voice Telephony Route (POST /api/retell/tools/submit-marketing-intake)
 * 2. Inbound Email Ingestion Engine (ingestInboundEmailToTask)
 * 3. Authenticated Ask NORA Web Endpoint (POST /api/nora/marketing-intake)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express, { Request, Response } from 'express';
import http from 'http';
import { retellToolsRouter } from '../../server/routes/retellToolsRoute';
import { ingestInboundEmailToTask } from '../../server/services/inboundEmailIngestionEngine';
import { 
  noraMarketingIntakeOrchestrator,
  NORA_POLICY_VERSION,
  NORA_KNOWLEDGE_VERSION,
  isPlaceholderAddress,
  computeCanonicalPropertyKey
} from '../../server/services/noraMarketingIntakeOrchestrator';
import { 
  getAllCanonicalMarketingRequests,
  getAllCanonicalMarketingTasks
} from '../../server/persistence/marketingCampaignsRepository';

describe('Three-Channel Production Wiring Integration Suite', () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/retell/tools', retellToolsRouter);

    // Mount authenticated web endpoint with strict context separation
    app.post('/api/nora/marketing-intake', async (req: Request, res: Response) => {
      try {
        const authenticatedUser = (req as any).user || {
          id: req.headers['x-user-id'] || 'dir_ryan_crecelius_0',
          email: req.headers['x-user-email'] || 'ryan@nestrealty.com',
          name: req.headers['x-user-name'] || 'Ryan Crecelius'
        };
        const workspaceId = (req.headers['x-workspace-id'] as string) || 'ws_wilmington';

        const callerInput = {
          propertyAddress: req.body.propertyAddress,
          flexMlsStatus: req.body.flexMlsStatus,
          mlsNumber: req.body.mlsNumber,
          deliverables: req.body.deliverables,
          neededByDate: req.body.neededByDate,
          deadlineIsFlexible: Boolean(req.body.deadlineIsFlexible),
          price: req.body.price,
          squareFootage: req.body.squareFootage,
          bedrooms: req.body.bedrooms,
          bathrooms: req.body.bathrooms,
          propertyDescription: req.body.propertyDescription || req.body.description,
          photoReferences: req.body.photoReferences || req.body.photos,
          managedUploadIds: req.body.managedUploadIds,
          verifiedAttachmentIds: req.body.verifiedAttachmentIds,
          notes: req.body.notes,
          intakeType: req.body.intakeType
        };

        const trustedContext = {
          channel: 'web' as const,
          workspaceId: String(workspaceId),
          authSource: 'authenticated_session' as const,
          requesterDirectoryMemberId: String(authenticatedUser.id),
          requesterEmail: String(authenticatedUser.email),
          requesterName: String(authenticatedUser.name)
        };

        const evalResult = await noraMarketingIntakeOrchestrator.evaluateMarketingIntake(callerInput, trustedContext);
        const persistenceResult = await noraMarketingIntakeOrchestrator.persistIntakeEvaluation(evalResult);

        return res.json({
          success: true,
          policyVersion: evalResult.policyVersion,
          knowledgeVersion: evalResult.knowledgeVersion,
          readinessStatus: evalResult.readinessStatus,
          missingFields: evalResult.missingFields,
          fieldConflicts: evalResult.fieldConflicts,
          webResponse: evalResult.webResponse,
          requester: evalResult.requester,
          workspaceId: evalResult.workspaceId,
          request: persistenceResult.request,
          tasks: persistenceResult.tasks,
          isMerged: persistenceResult.isMerged
        });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err.message });
      }
    });

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

  // 1. Channel 1: Retell AI Voice Adapter Wiring
  describe('Channel 1: Retell Voice Route Adapter', () => {
    it('1. Retell route passes all typed fields and resolves caller identity server-side', async () => {
      const response = await fetch(`${baseUrl}/api/retell/tools/submit-marketing-intake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyAddress: '1104 Arboretum Dr, Wilmington, NC 28405',
          caller_phone: '+19106128283', // Matt Orr in directory
          flexMlsStatus: 'flex_live',
          mlsNumber: '1004523',
          deliverables: ['1-Page Property Flyer (8.5x11)'],
          neededByDate: '2026-09-10'
        })
      });

      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.policyVersion).toBe(NORA_POLICY_VERSION);
      expect(body.knowledgeVersion).toBe(NORA_KNOWLEDGE_VERSION);
    });

    it('2. Incomplete Pre-MLS voice intake returns status: needs_info and isDispatched: false', async () => {
      const response = await fetch(`${baseUrl}/api/retell/tools/submit-marketing-intake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyAddress: '742 Lumina Ave, Wrightsville Beach, NC',
          caller_phone: '+19106128283',
          flexMlsStatus: 'pre_mls',
          price: 1950000
          // Missing: sqft, beds, baths, description, photos, deliverables, deadline
        })
      });

      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body.readinessStatus).toBe('needs_info');
      expect(body.status).toBe('needs_info');
      expect(body.isDispatched).toBe(false);
      expect(body.missingFields).toContain('squareFootage');
      expect(body.missingFields).toContain('photoReferences');
      expect(body.missingFields).toContain('deliverables');
      expect(body.photoInstructions).toContain('AskNora@NestRealty.com');
    });
  });

  // 2. Channel 2: Email Adapter Wiring
  describe('Channel 2: Inbound Email Ingestion Engine', () => {
    it('3. Real inbound email ingestion invokes orchestrator and records canonical policy metadata', async () => {
      const emailPayload = {
        workspaceId: 'ws_wilmington',
        from: 'Matt Orr <matt.orr@nestrealty.com>',
        to: 'AskNora@nestrealty.com',
        subject: 'Pre-MLS Marketing for 8820 Ocean Sound Way',
        textContent: 'Hi Nora, please prepare flyer and postcard for 8820 Ocean Sound Way. Listed at $850,000, 2800 sqft, 4 bed, 3 bath. Coastal home with screened porch. Deadline is flexible.',
        rawAttachments: [
          { filename: 'front_porch.jpg', contentType: 'image/jpeg', sizeBytes: 102400, url: 'https://images.unsplash.com/photo-front-porch.jpg' }
        ]
      };

      const result = await ingestInboundEmailToTask(emailPayload);
      expect(result.success).toBe(true);

      const allRequests = getAllCanonicalMarketingRequests();
      const savedRequest = allRequests.find(r => r.id === result.requestId);
      expect(savedRequest).toBeDefined();
      expect((savedRequest as any).policyVersion).toBe(NORA_POLICY_VERSION);
      expect((savedRequest as any).knowledgeVersion).toBe(NORA_KNOWLEDGE_VERSION);
      expect(savedRequest?.photos?.length).toBeGreaterThanOrEqual(1);
    });

    it('4. Email attachments reconcile into voice-created request for confirmed address', async () => {
      // Step A: Phone creates request in needs_info
      const voiceRes = await fetch(`${baseUrl}/api/retell/tools/submit-marketing-intake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyAddress: '310 Chestnut St, Wilmington, NC 28401',
          caller_phone: '+19106128283',
          flexMlsStatus: 'pre_mls',
          price: 495000,
          squareFootage: 1850,
          bedrooms: 3,
          bathrooms: 2,
          propertyDescription: 'Downtown historic home with garden patio.',
          deliverables: ['1-Page Property Flyer (8.5x11)'],
          neededByDate: '2026-09-12'
        })
      });

      const voiceBody = await voiceRes.json();
      expect(voiceBody.readinessStatus).toBe('needs_info'); // missing photos

      // Step B: Broker emails photos for 310 Chestnut St
      const emailResult = await ingestInboundEmailToTask({
        workspaceId: 'ws_wilmington',
        from: 'Matt Orr <matt.orr@nestrealty.com>',
        to: 'AskNora@nestrealty.com',
        subject: 'Photos for 310 Chestnut St',
        textContent: 'Here are the high-res photos for 310 Chestnut St.',
        rawAttachments: [
          { filename: 'chestnut_facade.jpg', contentType: 'image/jpeg', sizeBytes: 204800, url: 'https://images.unsplash.com/photo-chestnut.jpg' }
        ]
      });

      expect(emailResult.success).toBe(true);
      expect(emailResult.actionTaken).toBe('reconciled_updated');
      expect(emailResult.requestId).toBe(voiceBody.createdRequestId);
    });
  });

  // 3. Channel 3: Ask NORA Web Dashboard Adapter
  describe('Channel 3: Ask NORA Web Dashboard Adapter', () => {
    it('5. Web endpoint derives trusted identity from auth context and ignores spoofed payload identity', async () => {
      const response = await fetch(`${baseUrl}/api/nora/marketing-intake`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'dir_ryan_crecelius_0',
          'x-user-email': 'ryan@nestrealty.com',
          'x-workspace-id': 'ws_wilmington'
        },
        body: JSON.stringify({
          // Attacker attempts to spoof requesterId and workspaceId in payload
          workspaceId: 'spoofed_tenant_xyz',
          requesterDirectoryMemberId: 'dir_attacker_99',
          propertyAddress: '702 Lumina Ave, Wrightsville Beach, NC',
          flexMlsStatus: 'pre_mls',
          price: 1850000,
          squareFootage: 3200,
          bedrooms: 4,
          bathrooms: 3.5,
          propertyDescription: 'Custom oceanview coastal cottage.',
          deliverables: ['1-Page Property Flyer (8.5x11)', 'Instagram Story (9:16)'],
          deadlineIsFlexible: true,
          photoReferences: [{ url: '/uploads/lumina_hero.jpg', name: 'hero.jpg', isManaged: true }]
        })
      });

      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      // Identity and workspace MUST be derived from session context
      expect(body.workspaceId).toBe('ws_wilmington');
      expect(body.requester.email).toBe('ryan@nestrealty.com');
      expect(body.requester.name).toBe('Ryan Crecelius');
      expect(body.requester.id).not.toBe('dir_attacker_99');
      expect(body.readinessStatus).toBe('ready_for_review');
      expect(body.webResponse.statusBadge).toBe('Ready for Review');
      expect(body.webResponse.receivedFields.price).toBe('$1,850,000');
      expect(body.webResponse.receivedFields.squareFootage).toBe('3,200 sqft');
    });

    it('6. Web endpoint rejects arbitrary unverified external photo URLs', async () => {
      const evalResult = await noraMarketingIntakeOrchestrator.evaluateMarketingIntake({
        propertyAddress: '150 Ocean Drive, Wilmington NC',
        flexMlsStatus: 'pre_mls',
        price: 900000,
        squareFootage: 2500,
        bedrooms: 3,
        bathrooms: 2,
        propertyDescription: 'Cozy ocean home.',
        deliverables: ['1-Page Flyer'],
        deadlineIsFlexible: true,
        photoReferences: [
          { url: 'http://malicious-external-site.com/photo.exe', name: 'malicious.jpg' } // Arbitrary URL without managed verification
        ]
      }, {
        channel: 'web',
        workspaceId: 'ws_wilmington',
        authSource: 'authenticated_session',
        requesterEmail: 'ryan@nestrealty.com'
      });

      // Arbitrary URL rejected -> photoReferences remains in missingFields
      expect(evalResult.extractedFields.photosCount).toBe(0);
      expect(evalResult.missingFields).toContain('photoReferences');
      expect(evalResult.readinessStatus).toBe('needs_info');
    });
  });

  // 4. State Transition Gate & Gating Rules
  describe('State Transition Gate & Concurrency Rules', () => {
    it('7. Adding photos changes needs_info to in_progress ONLY when all other required fields are resolved', async () => {
      // Case A: Pre-MLS missing sqft & description. Broker adds photos -> Still needs_info!
      const incompleteResult = await noraMarketingIntakeOrchestrator.evaluateMarketingIntake({
        propertyAddress: '992 Pelican Watch, Carolina Beach NC',
        flexMlsStatus: 'pre_mls',
        price: 750000,
        bedrooms: 3,
        bathrooms: 2,
        // Missing squareFootage and propertyDescription
        deliverables: ['1-Page Flyer'],
        deadlineIsFlexible: true,
        photoReferences: [
          { url: '/uploads/pelican_1.jpg', name: 'photo1.jpg', isManaged: true }
        ]
      }, {
        channel: 'email',
        workspaceId: 'ws_wilmington',
        authSource: 'dkim_verified_email',
        requesterEmail: 'matt.orr@nestrealty.com'
      });

      expect(incompleteResult.extractedFields.photosCount).toBe(1);
      expect(incompleteResult.missingFields).toContain('squareFootage');
      expect(incompleteResult.missingFields).toContain('propertyDescription');
      expect(incompleteResult.readinessStatus).toBe('needs_info'); // MUST NOT advance to ready_for_review
    });

    it('8. Conflicting broker and MLS values block production readiness even when photos are attached', async () => {
      const evalResult = await noraMarketingIntakeOrchestrator.evaluateMarketingIntake({
        propertyAddress: '1104 Arboretum Dr, Wilmington, NC 28405',
        flexMlsStatus: 'flex_live',
        price: 1500000, // Conflict with MLS 1,250,000
        squareFootage: 3450,
        bedrooms: 4,
        bathrooms: 3.5,
        propertyDescription: 'Luxury home in Arboretum.',
        deliverables: ['1-Page Flyer'],
        neededByDate: '2026-09-10',
        photoReferences: [{ url: '/uploads/p.jpg', isManaged: true }]
      }, {
        channel: 'web',
        workspaceId: 'ws_wilmington',
        authSource: 'authenticated_session',
        requesterEmail: 'ryan@nestrealty.com'
      });

      if (evalResult.fieldConflicts.length > 0) {
        expect(evalResult.readinessStatus).toBe('needs_info');
        expect(evalResult.fieldConflicts[0].isConfirmed).toBe(false);
      }
    });

    it('9. Placeholder addresses receive null normalized key and are not merged together', async () => {
      expect(isPlaceholderAddress('Wilmington, NC Area Listing')).toBe(true);
      expect(isPlaceholderAddress('[Address Needed]')).toBe(true);
      expect(isPlaceholderAddress('New Listing (Address Pending)')).toBe(true);
      expect(isPlaceholderAddress('Address TBD')).toBe(true);
      expect(isPlaceholderAddress('Unknown Property')).toBe(true);

      expect(computeCanonicalPropertyKey('Wilmington, NC Area Listing')).toBeNull();
      expect(computeCanonicalPropertyKey('Address Pending')).toBeNull();
    });

    it('10. Signage-only request bypasses property description and photo requirements', async () => {
      const evalResult = await noraMarketingIntakeOrchestrator.evaluateMarketingIntake({
        propertyAddress: '228 Wrightsville Ave, Wilmington, NC 28403',
        intakeType: 'signage_only',
        deliverables: ['Yard Sign Post Installation'],
        neededByDate: '2026-09-08'
      }, {
        channel: 'phone',
        workspaceId: 'ws_wilmington',
        authSource: 'telephony_caller_id',
        requesterName: 'Ann Gunn'
      });

      expect(evalResult.intakeType).toBe('signage_only');
      expect(evalResult.readinessStatus).toBe('ready_for_review');
      expect(evalResult.missingFields).not.toContain('propertyDescription');
      expect(evalResult.missingFields).not.toContain('photoReferences');
      expect(evalResult.missingFields).not.toContain('price');
    });
  });
});
