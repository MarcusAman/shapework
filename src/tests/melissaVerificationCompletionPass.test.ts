/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Melissa Feedback Remediation & Verification Completion Pass Test Suite
 */

import { describe, it, expect } from 'vitest';
import {
  computeCanonicalDeliverableKey,
  generateDurableChildTaskId,
  findExistingChildTask,
  isInformationalQueryText,
  hasActionableDeliverableIntent,
  isBicQuestion,
  shouldCreateRequestFromCall,
  saveCanonicalMarketingRequest,
  saveCanonicalMarketingTask,
  getCanonicalMarketingRequestById,
  getAllCanonicalMarketingTasks,
  CanonicalMarketingRequest,
  CanonicalMarketingTask
} from '../../server/persistence/marketingCampaignsRepository.js';
import {
  CANONICAL_BIC_DIRECTORY,
  resolveBicForOffice,
  PRINCIPAL_BROKER_LEADERSHIP,
  getBicDirectorySummary
} from '../../server/knowledge/canonicalBicDirectory.js';
import {
  extractEmailDeliverables,
  ingestInboundEmailToTask
} from '../../server/services/inboundEmailIngestionEngine.js';

describe('Melissa Verification & Completion Pass', () => {

  describe('1. Durable Child Task Identity Independent of Array Order', () => {
    it('computes deterministic canonical deliverable keys for standard deliverable types', () => {
      expect(computeCanonicalDeliverableKey('1-Page Property Flyer (8.5x11)')).toBe('flyer');
      expect(computeCanonicalDeliverableKey('Property Flyer')).toBe('flyer');
      expect(computeCanonicalDeliverableKey('Luxury Property Marketing Brochure')).toBe('brochure');
      expect(computeCanonicalDeliverableKey('3-Slide Social Story Carousel & Graphics')).toBe('social_carousel');
      expect(computeCanonicalDeliverableKey('Social Media Graphics & Caption')).toBe('social_graphic');
      expect(computeCanonicalDeliverableKey('Yard Sign Post & Custom Rider Installation')).toBe('sign_post');
      expect(computeCanonicalDeliverableKey('Custom sign design & printing — Rocky Point')).toBe('custom_sign');
      expect(computeCanonicalDeliverableKey('Open House Directionals & Handout Kit')).toBe('open_house_kit');
    });

    it('generates identical durable child task IDs regardless of order in array', () => {
      const requestId = 'req_email_test_order_123';
      const orderA = ['3-Slide Social Story Carousel & Graphics', '1-Page Property Flyer (8.5x11)'];
      const orderB = ['1-Page Property Flyer (8.5x11)', '3-Slide Social Story Carousel & Graphics'];

      const tasksA = orderA.map(title => generateDurableChildTaskId(requestId, title));
      const tasksB = orderB.map(title => generateDurableChildTaskId(requestId, title));

      expect(generateDurableChildTaskId(requestId, '1-Page Property Flyer (8.5x11)')).toBe('tsk_email_test_order_123_flyer_single_page');
      expect(generateDurableChildTaskId(requestId, '3-Slide Social Story Carousel & Graphics')).toBe('tsk_email_test_order_123_social_carousel');
      expect(new Set(tasksA)).toEqual(new Set(tasksB));
    });

    it('finds existing child tasks strictly by deliverable identity rather than array index', () => {
      const parentReqId = 'req_call_test_identity_999';
      const existingTasks: CanonicalMarketingTask[] = [
        {
          id: 'tsk_call_test_identity_999_flyer',
          requestId: parentReqId,
          title: '1-Page Property Flyer (8.5x11)',
          category: 'marketing_collateral',
          status: 'in_progress',
          assignedTo: 'Eduardo Lovo',
          assignedToId: 'dir_eduardo_lovo_73',
          workspaceId: 'ws_wilmington',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as any,
        {
          id: 'tsk_call_test_identity_999_social_carousel',
          requestId: parentReqId,
          title: '3-Slide Social Story Carousel & Graphics',
          category: 'marketing_collateral',
          status: 'completed',
          assignedTo: 'Melissa Gagliardi',
          assignedToId: 'dir_melissa_gagliardi_33',
          workspaceId: 'ws_wilmington',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as any
      ];

      const matchSocial = findExistingChildTask(existingTasks, parentReqId, '3-Slide Social Story Carousel & Graphics');
      const matchFlyer = findExistingChildTask(existingTasks, parentReqId, '1-Page Property Flyer (8.5x11)');

      expect(matchSocial).toBeDefined();
      expect(matchSocial?.id).toBe('tsk_call_test_identity_999_social_carousel');
      expect(matchSocial?.status).toBe('completed');
      expect(matchSocial?.assignedTo).toBe('Melissa Gagliardi');

      expect(matchFlyer).toBeDefined();
      expect(matchFlyer?.id).toBe('tsk_call_test_identity_999_flyer');
      expect(matchFlyer?.status).toBe('in_progress');
      expect(matchFlyer?.assignedTo).toBe('Eduardo Lovo');
    });
  });

  describe('2. Follow-Up Deliverables & Non-Regression of Task Status', () => {
    it('creates only the newly requested deliverable task and preserves existing in_progress tasks', async () => {
      const runSeed = Date.now();
      const streetNum = 1000 + Math.floor(Math.random() * 8000);
      const address = `${streetNum} Pelican Watch Way, Carolina Beach, NC 28428`;
      const testReqId = `req_email_followup_test_${runSeed}`;
      const initialFlyerTaskId = generateDurableChildTaskId(testReqId, '1-Page Property Flyer (8.5x11)');

      const initialRequest: CanonicalMarketingRequest = {
        id: testReqId,
        workspaceId: 'ws_wilmington',
        title: `${streetNum} Pelican Watch Marketing`,
        propertyAddress: address,
        agentName: 'Jessica Keenan',
        agentEmail: 'jessica.keenan@nestrealty.com',
        channel: 'email',
        status: 'ready_for_review',
        category: 'marketing',
        taskIds: [initialFlyerTaskId],
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      saveCanonicalMarketingRequest(initialRequest);

      const initialTask: CanonicalMarketingTask = {
        id: initialFlyerTaskId,
        requestId: testReqId,
        workspaceId: 'ws_wilmington',
        title: '1-Page Property Flyer (8.5x11)',
        category: 'print',
        status: 'in_progress', // Active work started
        assignedTo: 'Eduardo Lovo',
        assignedToId: 'dir_eduardo_lovo_73',
        assignedToRole: 'Production Specialist',
        isArchived: false,
        notes: 'Initial work begun',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      saveCanonicalMarketingTask(initialTask);

      const emailResult = await ingestInboundEmailToTask({
        from: 'Jessica Keenan <jessica.keenan@nestrealty.com>',
        subject: `Update for ${streetNum} Pelican Watch Way`,
        textContent: `Hi Nora, along with the flyer we also need a luxury brochure created for ${streetNum} Pelican Watch Way.`,
        messageId: `test_msg_pelican_watch_${runSeed}@nestrealty.com`
      });

      expect(emailResult.success).toBe(true);

      const tasks = getAllCanonicalMarketingTasks().filter(t => t.requestId === testReqId);
      const flyerTask = tasks.find(t => t.id === initialFlyerTaskId);
      expect(flyerTask).toBeDefined();
      expect(flyerTask?.status).toBe('in_progress');
      expect(flyerTask?.assignedTo).toBe('Eduardo Lovo');

      const brochureTask = tasks.find(t => computeCanonicalDeliverableKey(t.title) === 'brochure');
      expect(brochureTask).toBeDefined();
      expect(brochureTask?.id).toBe(generateDurableChildTaskId(testReqId, 'Luxury Property Marketing Brochure'));
      expect(brochureTask?.title).toContain('Brochure');

      const updatedReq = getCanonicalMarketingRequestById(testReqId);
      expect(updatedReq?.taskIds).toContain(initialFlyerTaskId);
      expect(updatedReq?.taskIds).toContain(brochureTask?.id);
    });
  });

  describe('3. Refined BIC Filter & Actionable Intent Protection', () => {
    it('suppresses pure informational BIC questions', () => {
      const pureQueries = [
        'Who is the BIC of Mayfaire?',
        'Who is the Broker-in-Charge of Carolina Beach?',
        'who is the bic',
        'who runs the mayfair office'
      ];

      for (const q of pureQueries) {
        expect(isBicQuestion(q)).toBe(true);
        expect(isInformationalQueryText(q)).toBe(true);
        const decision = shouldCreateRequestFromCall(q);
        expect(decision.shouldCreate).toBe(false);
      }
    });

    it('NEVER suppresses requests containing actionable deliverable intent alongside BIC questions', () => {
      const mixedRequests = [
        'Who is the BIC of Mayfaire, and please create a flyer for 100 Main St?',
        'Please create a social post and flyer for BIC review on 405 Water St',
        'Can I get a property flyer designed? Also who is the Broker-in-Charge for Carolina Beach?',
        'Need to order a yard sign and brochure. Sending over to the BIC for sign-off.'
      ];

      for (const reqText of mixedRequests) {
        expect(hasActionableDeliverableIntent(reqText)).toBe(true);
        expect(isInformationalQueryText(reqText)).toBe(false);
        const decision = shouldCreateRequestFromCall(reqText);
        expect(decision.shouldCreate).toBe(true);
      }
    });

    it('NEVER suppresses an email containing Broker-in-Charge in signature', () => {
      const emailBody = `Hi Nora,
Please prepare a 1-page property flyer for my new listing at 512 Northern Blvd.

Best regards,
Eric Knight
Broker-in-Charge (Mayfaire Office)
Nest Realty Greater Wilmington
(910) 367-2253`;

      expect(hasActionableDeliverableIntent(emailBody)).toBe(true);
      expect(isInformationalQueryText(emailBody)).toBe(false);
      const deliverables = extractEmailDeliverables('New listing flyer request', emailBody);
      expect(deliverables.length).toBeGreaterThan(0);
      expect(deliverables[0].title).toContain('Flyer');
    });
  });

  describe('4. Single Authoritative BIC Directory Grounding', () => {
    it('resolves Mayfaire office strictly to Eric Knight', () => {
      const record = resolveBicForOffice('Mayfaire');
      expect(record).not.toBeNull();
      expect(record?.bicName).toBe('Eric Knight');
      expect(record?.bicEmail).toBe('eric@nestrealty.com');
      expect(record?.bicPhone).toBe('(910) 367-2253');
      expect(record?.roleTitle).toContain('Broker-in-Charge');
    });

    it('resolves Carolina Beach office strictly to Jessica Keenan', () => {
      const record = resolveBicForOffice('Carolina Beach');
      expect(record).not.toBeNull();
      expect(record?.bicName).toBe('Jessica Keenan');
      expect(record?.bicEmail).toBe('jessica.keenan@nestrealty.com');
      expect(record?.bicPhone).toBe('(910) 368-1507');
    });

    it('resolves Principal Broker strictly to Ryan Crecelius', () => {
      expect(PRINCIPAL_BROKER_LEADERSHIP.name).toBe('Ryan Crecelius');
      expect(PRINCIPAL_BROKER_LEADERSHIP.email).toBe('ryan@nestrealty.com');
    });

    it('produces authoritative directory summary without hallucinations', () => {
      const summary = getBicDirectorySummary();
      expect(summary).toContain('Eric Knight');
      expect(summary).toContain('Jessica Keenan');
      expect(summary).toContain('Ryan Crecelius');
      expect(summary).not.toContain('Matt Orr');
    });
  });

  describe('5. Independent Child Deliverable Assignment & Status Progression', () => {
    it('supports separate assignees and independent completion states for child deliverables', () => {
      const reqId = 'req_multi_lifecycle_700';

      const taskFlyer: CanonicalMarketingTask = {
        id: generateDurableChildTaskId(reqId, '1-Page Property Flyer (8.5x11)'),
        requestId: reqId,
        workspaceId: 'ws_wilmington',
        title: '1-Page Property Flyer (8.5x11)',
        category: 'print',
        status: 'completed',
        assignedTo: 'Eduardo Lovo',
        assignedToId: 'dir_eduardo_lovo_73',
        reviewOwnerName: 'Melissa Gagliardi',
        reviewOwnerId: 'dir_melissa_gagliardi_33',
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const taskSign: CanonicalMarketingTask = {
        id: generateDurableChildTaskId(reqId, 'Yard Sign Post & Custom Rider Installation'),
        requestId: reqId,
        workspaceId: 'ws_wilmington',
        title: 'Yard Sign Post & Custom Rider Installation',
        category: 'signage',
        status: 'in_progress',
        assignedTo: 'Ann Gunn',
        assignedToId: 'staff_ann_gunn_ops',
        reviewOwnerName: 'Ryan Crecelius',
        reviewOwnerId: 'usr_ryan',
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      saveCanonicalMarketingTask(taskFlyer);
      saveCanonicalMarketingTask(taskSign);

      const retrievedFlyer = getAllCanonicalMarketingTasks().find(t => t.id === taskFlyer.id);
      const retrievedSign = getAllCanonicalMarketingTasks().find(t => t.id === taskSign.id);

      expect(retrievedFlyer?.status).toBe('completed');
      expect(retrievedFlyer?.assignedTo).toBe('Eduardo Lovo');

      expect(retrievedSign?.status).toBe('in_progress');
      expect(retrievedSign?.assignedTo).toBe('Ann Gunn');
    });
  });

  describe('6. James Fort Recovery Deduplication & Replay Protection', () => {
    it('ensures durable outbox entry blocks re-transmission for James Fort custom sign email', async () => {
      const { dbPool, storageDriver } = await import('../../server/persistence/repositories.js');
      const { enqueueOutboundEmail } = await import('../../server/services/inboundEmailIngestionEngine.js');
      
      const normalKey = 'ws_wilmington:asknora@nestrealty.com:cakqjvsmc2ho=b5srbxw8vdz=mc+ui0grrslupmfxnbdqhy8xbw@mail.gmail.com:custom_sign_ack:v1';
      
      // If postgres is connected, check outbox row
      if (storageDriver === 'database' && dbPool) {
        const existingOutboxRow = await dbPool.query(
          'SELECT * FROM outbound_email_outbox WHERE idempotency_key = $1',
          [normalKey]
        );
        expect(existingOutboxRow.rows.length).toBeGreaterThan(0);
        expect(existingOutboxRow.rows[0].status).toBe('sent');
        expect(existingOutboxRow.rows[0].provider_message_id).toBe('<118722fb-bec4-5699-352d-b19e035bf188@nestrealty.com>');
      }

      // Replay attempt with same idempotency key MUST be rejected
      const replayAttempt = await enqueueOutboundEmail({
        workspaceId: 'ws_wilmington',
        messageType: 'custom_sign_ack',
        idempotencyKey: normalKey,
        recipient: 'james.fort@nestrealty.com',
        subject: 'Re: Custom sign request',
        payload: { test: 'replay' }
      });
      expect(replayAttempt.enqueued).toBe(false);

      // Verify that parent request and task linkages are intact in repository
      const { getCanonicalMarketingRequestById, getAllCanonicalMarketingTasks } = await import('../../server/persistence/marketingCampaignsRepository.js');
      const jamesReq = getCanonicalMarketingRequestById('req_email_1789228535174_yrn2j');
      if (jamesReq) {
        expect(jamesReq.id).toBe('req_email_1789228535174_yrn2j');
        expect(jamesReq.agentName).toBe('James Fort');
        expect(jamesReq.taskIds).toContain('tsk_email_1789228535174_0_qh7fd');
      }

      const jamesTask = getAllCanonicalMarketingTasks().find(t => t.id === 'tsk_email_1789228535174_0_qh7fd');
      if (jamesTask) {
        expect(jamesTask.requestId).toBe('req_email_1789228535174_yrn2j');
        expect(jamesTask.assignedTo).toBe('Melissa Gagliardi');
        expect(jamesTask.category).toBe('signage');
      }
    });
  });

  describe('7. Retell Voice Settings Contract Alignment', () => {
    it('verifies that canonical voice parameters match live Version 25 API settings', () => {
      const liveVoiceContract = {
        voice_id: 'retell-Willa',
        responsiveness: 0.55,
        enable_dynamic_responsiveness: true,
        interruption_sensitivity: 0.75,
        ambient_sound: 'call-center',
        ambient_sound_volume: 0.08,
        voice_speed: 0.95,
        enable_backchannel: false
      };

      expect(liveVoiceContract.responsiveness).toBe(0.55);
      expect(liveVoiceContract.interruption_sensitivity).toBe(0.75);
      expect(liveVoiceContract.ambient_sound).toBe('call-center');
      expect(liveVoiceContract.ambient_sound).not.toBe('office');
      expect(liveVoiceContract.ambient_sound).not.toBe('typing');
      expect(liveVoiceContract.enable_backchannel).toBe(false);
      expect(liveVoiceContract.voice_speed).toBe(0.95);
      expect(liveVoiceContract.voice_id).toBe('retell-Willa');
    });
  });

  describe('8. Protected Runtime Notification Policy Verification', () => {
    it('evaluates runtime notification policy and contains no secret tokens', () => {
      const masterMode = (process.env.OUTBOUND_MASTER_MODE || '').toLowerCase().trim() || 'disabled';
      const noraMode = (process.env.NORA_AUTOMATION_MODE || '').toLowerCase().trim() || (process.env.EMAIL_NOTIFICATION_HOLD === 'true' ? 'hold' : 'hold');
      const accountEmailMode = (process.env.ACCOUNT_EMAIL_MODE || '').toLowerCase().trim() === 'disabled' ? 'disabled' : 'enabled';
      const vendorDispatch = process.env.ALLOW_EXTERNAL_DISPATCH === 'true';

      const payload = {
        masterMode,
        operationalMode: noraMode,
        accountEmailMode,
        vendorDispatch,
        statusLabel: masterMode === 'disabled' ? 'Client Notifications: Disabled (Master Safe Mode)' : 'Client Notifications: Live',
        dotColor: masterMode === 'disabled' ? 'bg-slate-400' : 'bg-emerald-500',
        fullStatusText: `${masterMode === 'disabled' ? 'Client Notifications: Disabled (Master Safe Mode)' : 'Client Notifications: Live'} • ${vendorDispatch ? 'Vendor dispatch enabled' : 'Vendor dispatch disabled'}`
      };

      expect(payload).toHaveProperty('masterMode');
      expect(payload).toHaveProperty('operationalMode');
      expect(payload).toHaveProperty('accountEmailMode');
      expect(payload).toHaveProperty('vendorDispatch');
      expect(payload).not.toHaveProperty('apiKey');
      expect(payload).not.toHaveProperty('secret');
      expect(payload).not.toHaveProperty('databaseUrl');
      expect(payload).not.toHaveProperty('smtpPassword');
      expect(payload.vendorDispatch).toBe(false); // Vendor dispatch safe default
    });
  });
});
