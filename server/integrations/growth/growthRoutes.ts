/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { getEmailProvider, getProviderMode } from '../../growth/providers/emailProviderFactory.js';
import { GoogleGenAI } from '@google/genai';
import { seedPlaybooks } from '../../persistence/growthSeed.js';
import { runCampaignComplianceCheck } from './growthCompliance.js';
import crypto from 'crypto';

export function generateUnsubscribeToken(wsId: string, contactId: string, campaignId: string): string {
  const data = JSON.stringify({ wsId, contactId, campaignId });
  const hmac = crypto.createHmac('sha256', process.env.JWT_SECRET || 'fallback_secret').update(data).digest('hex');
  return Buffer.from(JSON.stringify({ data, hmac })).toString('base64');
}

export function computeComplianceHash(campaign: any, steps: any[], contacts: any[]): string {
  const content = JSON.stringify({
    campaignName: campaign.name,
    sendingDomainId: campaign.sendingDomainId,
    steps: steps.map(s => ({ stepNumber: s.stepNumber, subject: s.subject, body: s.body })),
    contacts: contacts.map(c => ({ email: c.email, source: c.source })).sort((a,b) => a.email.localeCompare(b.email))
  });
  return crypto.createHash('sha256').update(content).digest('hex');
}

function getGeminiClient(): GoogleGenAI | null {
  if (process.env.GEMINI_API_KEY) {
    return new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return null;
}

export function sanitizeProviderLog(log: any): any {
  if (!log) return log;
  const sanitized = JSON.parse(JSON.stringify(log));

  const recursiveSanitize = (obj: any) => {
    if (!obj || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (typeof val === 'string') {
        const valLower = val.toLowerCase();
        const keyLower = key.toLowerCase();
        if (
          keyLower.includes('key') ||
          keyLower.includes('secret') ||
          keyLower.includes('token') ||
          keyLower.includes('auth') ||
          val.startsWith('re_') ||
          val.startsWith('whsec_') ||
          valLower.includes('bearer ') ||
          valLower.includes('basic ')
        ) {
          obj[key] = '[REDACTED]';
        } else if (val.length > 1000) {
          obj[key] = val.substring(0, 1000) + '... [TRUNCATED]';
        }
      } else if (typeof val === 'object') {
        recursiveSanitize(val);
      }
    }
  };

  recursiveSanitize(sanitized);
  return sanitized;
}

const PROHIBITED_SOURCES = [
  'purchased_list',
  'scraped_data',
  'unknown_source',
  'no_source',
  'third_party_list_without_permission'
];

export function getGrowthRouter(dbState: any, persistState: (wsId?: string) => Promise<void>) {
  function logProviderEvent(wsId: string, event: any) {
    dbState.providerLogs = dbState.providerLogs || [];
    dbState.providerLogs.push(sanitizeProviderLog({
      id: `log_${Math.random().toString(36).substring(2, 11)}`,
      workspaceId: wsId,
      createdAt: new Date().toISOString(),
      ...event
    }));
  }
  // Startup assertions: Test-only features/routes must never be enabled in production environment
  const isProd = process.env.APP_MODE === 'production' || process.env.NODE_ENV === 'production';
  const isTestEnabled = process.env.GROWTH_TEST_MODE === 'true' || process.env.NODE_ENV === 'test';
  const isProdForAssertion = process.env.NODE_ENV === 'production' || (process.env.APP_MODE === 'production' && !process.env.PLAYWRIGHT_TEST);
  if (isProdForAssertion && isTestEnabled) {
    throw new Error('FATAL: Startup assertion failed: Test-only features or overrides are enabled in production mode.');
  }
  if (isProdForAssertion) {
    if (!process.env.RESEND_API_KEY || !process.env.RESEND_WEBHOOK_SECRET) {
      throw new Error('FATAL: Startup assertion failed: RESEND_API_KEY and RESEND_WEBHOOK_SECRET must be configured in production mode.');
    }
  }

  const router = Router();
  const provider = getEmailProvider();

  // Helper to ensure lists exist in dbState
  const initLists = (wsId: string) => {
    dbState.sendingDomains = dbState.sendingDomains || [];
    dbState.sendingAccounts = dbState.sendingAccounts || [];
    dbState.contacts = dbState.contacts || [];
    dbState.contactSources = dbState.contactSources || [];
    dbState.audiences = dbState.audiences || [];
    dbState.audienceContacts = dbState.audienceContacts || [];
    dbState.segments = dbState.segments || [];
    dbState.playbooks = dbState.playbooks || [];
    dbState.campaigns = dbState.campaigns || [];
    dbState.campaignSteps = dbState.campaignSteps || [];
    dbState.campaignEnrollments = dbState.campaignEnrollments || [];
    dbState.emailMessages = dbState.emailMessages || [];
    dbState.emailEvents = dbState.emailEvents || [];
    dbState.replies = dbState.replies || [];
    dbState.replyClassifications = dbState.replyClassifications || [];
    dbState.suppressionList = dbState.suppressionList || [];
    dbState.unsubscribeEvents = dbState.unsubscribeEvents || [];
    dbState.bounceEvents = dbState.bounceEvents || [];
    dbState.complaintEvents = dbState.complaintEvents || [];
    dbState.complianceChecks = dbState.complianceChecks || [];
    dbState.providerLogs = dbState.providerLogs || [];
    dbState.tasks = dbState.tasks || [];

    // Seed playbooks if empty
    if (dbState.playbooks.length === 0) {
      dbState.playbooks = seedPlaybooks.map((pb: any) => ({
        ...pb,
        workspaceId: wsId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
    }

    // Seed contact sources if empty
    if (dbState.contactSources.length === 0) {
      dbState.contactSources = [
        {
          id: 'src_manual',
          workspaceId: wsId,
          sourceName: 'manual_input',
          description: 'Manually added via single-contact creation form.',
          createdAt: new Date().toISOString()
        },
        {
          id: 'src_purchased',
          workspaceId: wsId,
          sourceName: 'purchased_list',
          description: 'Purchased cold mailing lists - Prohibited.',
          createdAt: new Date().toISOString()
        },
        {
          id: 'src_website',
          workspaceId: wsId,
          sourceName: 'website_lead',
          description: 'Leads generated from the public agent web forms.',
          createdAt: new Date().toISOString()
        }
      ];
    }
  };

  const getWorkspaceId = (req: any) => req.workspaceId || req.workspace?.id || 'nest-realty-demo';

  // GET State Rollup
  router.get('/state', async (req: any, res) => {
    const wsId = getWorkspaceId(req);
    initLists(wsId);
    const filterByWs = (arr: any[]) => (arr || []).filter(item => item.workspaceId === wsId || !item.workspaceId);

    res.json({
      providerMode: getProviderMode(),
      apiKeyConfigured: !!process.env.RESEND_API_KEY,
      webhookSecretConfigured: !!process.env.RESEND_WEBHOOK_SECRET,
      sendingDomains: filterByWs(dbState.sendingDomains),
      sendingAccounts: filterByWs(dbState.sendingAccounts),
      contacts: filterByWs(dbState.contacts),
      contactSources: filterByWs(dbState.contactSources),
      audiences: filterByWs(dbState.audiences),
      audienceContacts: filterByWs(dbState.audienceContacts),
      segments: filterByWs(dbState.segments),
      playbooks: filterByWs(dbState.playbooks),
      campaigns: filterByWs(dbState.campaigns),
      campaignSteps: filterByWs(dbState.campaignSteps),
      campaignEnrollments: filterByWs(dbState.campaignEnrollments),
      emailMessages: filterByWs(dbState.emailMessages),
      emailEvents: filterByWs(dbState.emailEvents),
      replies: filterByWs(dbState.replies),
      replyClassifications: filterByWs(dbState.replyClassifications),
      suppressionList: filterByWs(dbState.suppressionList),
      unsubscribeEvents: filterByWs(dbState.unsubscribeEvents),
      bounceEvents: filterByWs(dbState.bounceEvents),
      complaintEvents: filterByWs(dbState.complaintEvents),
      complianceChecks: filterByWs(dbState.complianceChecks),
      providerLogs: filterByWs(dbState.providerLogs),
      growthSendJobs: filterByWs(dbState.growthSendJobs),
      tasks: filterByWs(dbState.tasks)
    });
  });

  // POST Add Email to Suppression List
  router.post('/suppression/add', async (req: any, res) => {
    const wsId = getWorkspaceId(req);
    const { email, reason } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    initLists(wsId);
    const existSup = dbState.suppressionList.some(
      (s: any) => s.email.toLowerCase() === email.toLowerCase() && s.workspaceId === wsId
    );
    if (!existSup) {
      dbState.suppressionList.push({
        id: `sup_${Math.random().toString(36).substring(2, 11)}`,
        workspaceId: wsId,
        email: email.toLowerCase(),
        reason: reason || 'manual',
        createdAt: new Date().toISOString()
      });
    }

    // Stop active enrollments for this contact
    const contact = dbState.contacts.find(
      (c: any) => c.email.toLowerCase() === email.toLowerCase() && c.workspaceId === wsId
    );
    if (contact) {
      const enrollments = dbState.campaignEnrollments.filter(
        (e: any) => e.contactId === contact.id && e.status === 'active'
      );
      for (const e of enrollments) {
        e.status = 'stopped';
        e.stoppedReason = reason || 'manual';
        e.updatedAt = new Date().toISOString();
      }
    }

    await persistState(wsId);
    res.json({ success: true });
  });

  // GET Audiences
  router.get('/audiences', async (req: any, res) => {
    const wsId = getWorkspaceId(req);
    initLists(wsId);
    res.json(dbState.audiences.filter((a: any) => a.workspaceId === wsId));
  });

  // POST Create Audience
  router.post('/audiences', async (req: any, res) => {
    const wsId = getWorkspaceId(req);
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Audience name is required.' });

    initLists(wsId);
    const newAud = {
      id: `aud_${Math.random().toString(36).substring(2, 11)}`,
      workspaceId: wsId,
      name,
      description: description || '',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    dbState.audiences.push(newAud);
    await persistState(wsId);
    res.json(newAud);
  });

  // GET Contacts
  router.get('/contacts', async (req: any, res) => {
    const wsId = getWorkspaceId(req);
    initLists(wsId);
    res.json(dbState.contacts.filter((c: any) => c.workspaceId === wsId));
  });

  // POST Create Contact
  const createContactHandler = async (req: any, res: any) => {
    const wsId = getWorkspaceId(req);
    const { email, firstName, lastName, phone, company, role, type, source, market, tags } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    initLists(wsId);
    
    // Check if contact already exists
    let contact = dbState.contacts.find((c: any) => c.email.toLowerCase() === email.toLowerCase() && c.workspaceId === wsId);
    if (contact) {
      contact.firstName = firstName || contact.firstName;
      contact.lastName = lastName || contact.lastName;
      contact.phone = phone || contact.phone;
      contact.company = company || contact.company;
      contact.role = role || contact.role;
      contact.contactType = type || contact.contactType || 'lead';
      contact.source = source || contact.source || 'manual_input';
      contact.market = market || contact.market;
      contact.tags = tags || contact.tags;
      contact.updatedAt = new Date().toISOString();
    } else {
      contact = {
        id: `con_${Math.random().toString(36).substring(2, 11)}`,
        workspaceId: wsId,
        firstName: firstName || '',
        lastName: lastName || '',
        email: email.toLowerCase(),
        phone: phone || '',
        company: company || '',
        role: role || '',
        contactType: type || 'lead',
        source: source || 'manual_input',
        market: market || 'Central',
        tags: Array.isArray(tags) ? tags : [],
        relationshipStatus: 'nurture',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      dbState.contacts.push(contact);
    }
    
    await persistState(wsId);
    res.json(contact);
  };

  router.post('/contacts', createContactHandler);
  router.post('/contacts/create', createContactHandler);

  // Shared Helper for bulk import
  const importContactsToAudience = async (req: any, res: any) => {
    const wsId = getWorkspaceId(req);
    const { audienceId, contacts: rawContacts } = req.body;
    if (!audienceId || !rawContacts || !Array.isArray(rawContacts)) {
      return res.status(400).json({ error: 'AudienceId and contacts array are required.' });
    }

    initLists(wsId);
    const imported = [];
    for (const raw of rawContacts) {
      if (!raw.email) continue;
      
      let contact = dbState.contacts.find(
        (c: any) => c.email.toLowerCase() === raw.email.toLowerCase() && c.workspaceId === wsId
      );
      if (!contact) {
        contact = {
          id: `con_${Math.random().toString(36).substring(2, 11)}`,
          workspaceId: wsId,
          firstName: raw.firstName || '',
          lastName: raw.lastName || '',
          email: raw.email.toLowerCase(),
          phone: raw.phone || '',
          company: raw.company || '',
          contactType: raw.type || 'lead',
          source: raw.source || 'manual_input',
          market: raw.market || 'Central',
          tags: Array.isArray(raw.tags) ? raw.tags : [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        dbState.contacts.push(contact);
      }

      // Link to audience
      const exists = dbState.audienceContacts.some(
        (ac: any) => ac.audienceId === audienceId && ac.contactId === contact.id
      );
      if (!exists) {
        dbState.audienceContacts.push({
          id: `ac_${Math.random().toString(36).substring(2, 11)}`,
          workspaceId: wsId,
          audienceId,
          contactId: contact.id,
          createdAt: new Date().toISOString()
        });
      }
      imported.push(contact);
    }

    dbState.campaigns.forEach((c: any) => {
      if (c.audienceId === audienceId && c.workspaceId === wsId) {
        c.audienceLastChangedAt = new Date().toISOString();
      }
    });

    await persistState(wsId);
    res.json({ success: true, count: imported.length });
  };

  // POST Contacts Import to Audience (supports both options)
  router.post('/contacts/import', importContactsToAudience);

  router.post('/audiences/:id/import', async (req: any, res) => {
    req.body.audienceId = req.params.id;
    return importContactsToAudience(req, res);
  });

  router.delete('/audiences/:id/contacts/:contactId', async (req: any, res) => {
    const wsId = getWorkspaceId(req);
    const { id, contactId } = req.params;
    initLists(wsId);
    
    dbState.audienceContacts = dbState.audienceContacts.filter(
      (ac: any) => !(ac.audienceId === id && ac.contactId === contactId && ac.workspaceId === wsId)
    );

    dbState.campaigns.forEach((c: any) => {
      if (c.audienceId === id && c.workspaceId === wsId) {
        c.audienceLastChangedAt = new Date().toISOString();
      }
    });

    await persistState(wsId);
    res.json({ success: true });
  });

  // GET Playbooks
  router.get('/playbooks', async (req: any, res) => {
    const wsId = getWorkspaceId(req);
    initLists(wsId);
    res.json(dbState.playbooks.filter((p: any) => p.workspaceId === wsId));
  });

  // POST Seed Playbooks
  router.post('/playbooks/seed', async (req: any, res) => {
    const wsId = getWorkspaceId(req);
    initLists(wsId);
    dbState.playbooks = seedPlaybooks.map((pb: any) => ({
      ...pb,
      workspaceId: wsId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    await persistState(wsId);
    res.json({ success: true, count: dbState.playbooks.length });
  });

  // GET Campaigns
  router.get('/campaigns', async (req: any, res) => {
    const wsId = getWorkspaceId(req);
    initLists(wsId);
    res.json(dbState.campaigns.filter((c: any) => c.workspaceId === wsId));
  });

  // POST Create Campaign
  router.post('/campaigns', async (req: any, res) => {
    const wsId = getWorkspaceId(req);
    const { name, playbookId, audienceId, sendingDomainId, goal, tone, market, cta, offer, steps } = req.body;
    if (!name) return res.status(400).json({ error: 'Campaign name is required.' });

    initLists(wsId);
    const newCamp = {
      id: `camp_${Math.random().toString(36).substring(2, 11)}`,
      workspaceId: wsId,
      name,
      playbookId: playbookId || null,
      audienceId: audienceId || null,
      sendingDomainId: sendingDomainId || null,
      status: 'draft',
      goal: goal || '',
      tone: tone || 'professional',
      market: market || 'Central',
      cta: cta || '',
      offer: offer || '',
      createdBy: 'usr_marcus',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    dbState.campaigns.push(newCamp);

    // Save campaign steps if provided
    if (steps && Array.isArray(steps)) {
      steps.forEach((s: any, idx: number) => {
        dbState.campaignSteps.push({
          id: `step_${Math.random().toString(36).substring(2, 11)}`,
          workspaceId: wsId,
          campaignId: newCamp.id,
          stepNumber: s.stepNumber || idx + 1,
          delayDays: s.delayDays || 0,
          subject: s.subject || 'Nurture Outreach',
          body: s.body || '',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      });
    }

    await persistState(wsId);
    res.json(newCamp);
  });

  // GET Campaign Steps
  router.get('/campaigns/:id/steps', async (req: any, res) => {
    const wsId = getWorkspaceId(req);
    const { id } = req.params;
    initLists(wsId);
    res.json(dbState.campaignSteps.filter((s: any) => s.campaignId === id && s.workspaceId === wsId));
  });

  // POST Campaign Steps
  router.post('/campaigns/:id/steps', async (req: any, res) => {
    const wsId = getWorkspaceId(req);
    const { id } = req.params;
    const { stepNumber, delayDays, subject, body } = req.body;
    if (!subject || !body) return res.status(400).json({ error: 'Subject and body are required.' });

    initLists(wsId);
    const newStep = {
      id: `step_${Math.random().toString(36).substring(2, 11)}`,
      workspaceId: wsId,
      campaignId: id,
      stepNumber: Number(stepNumber) || 1,
      delayDays: Number(delayDays) || 0,
      subject,
      body,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    dbState.campaignSteps.push(newStep);
    
    const campaign = dbState.campaigns.find((c: any) => c.id === id);
    if (campaign) {
      campaign.campaignLastChangedAt = new Date().toISOString();
    }

    await persistState(wsId);
    res.json(newStep);
  });

  // PATCH Campaign Step
  router.patch('/campaign-steps/:stepId', async (req: any, res) => {
    const wsId = getWorkspaceId(req);
    const { stepId } = req.params;
    const { subject, body, delayDays, isActive } = req.body;

    initLists(wsId);
    const step = dbState.campaignSteps.find((s: any) => s.id === stepId && s.workspaceId === wsId);
    if (!step) return res.status(404).json({ error: 'Step not found.' });

    if (subject !== undefined) step.subject = subject;
    if (body !== undefined) step.body = body;
    if (delayDays !== undefined) step.delayDays = Number(delayDays);
    if (isActive !== undefined) step.isActive = Boolean(isActive);
    step.updatedAt = new Date().toISOString();

    const campaign = dbState.campaigns.find((c: any) => c.id === step.campaignId);
    if (campaign) {
      campaign.campaignLastChangedAt = new Date().toISOString();
    }

    await persistState(wsId);
    res.json(step);
  });

  // GET Campaign Details
  router.get('/campaigns/:id', async (req: any, res) => {
    const wsId = getWorkspaceId(req);
    const { id } = req.params;
    initLists(wsId);
    const campaign = dbState.campaigns.find((c: any) => c.id === id && c.workspaceId === wsId);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found.' });
    res.json(campaign);
  });

  // PATCH Campaign
  router.patch('/campaigns/:id', async (req: any, res) => {
    const wsId = getWorkspaceId(req);
    const { id } = req.params;
    const { name, audienceId, sendingDomainId, goal, tone, market, cta, offer } = req.body;

    initLists(wsId);
    const campaign = dbState.campaigns.find((c: any) => c.id === id && c.workspaceId === wsId);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found.' });

    if (name !== undefined) campaign.name = name;
    if (audienceId !== undefined) campaign.audienceId = audienceId;
    if (sendingDomainId !== undefined) campaign.sendingDomainId = sendingDomainId;
    if (goal !== undefined) campaign.goal = goal;
    if (tone !== undefined) campaign.tone = tone;
    if (market !== undefined) campaign.market = market;
    if (cta !== undefined) campaign.cta = cta;
    if (offer !== undefined) campaign.offer = offer;
    campaign.updatedAt = new Date().toISOString();
    campaign.campaignLastChangedAt = new Date().toISOString();

    await persistState(wsId);
    res.json(campaign);
  });

  // POST Generate Sequence from playbook
  router.post('/campaigns/:id/generate-sequence', async (req: any, res) => {
    const wsId = getWorkspaceId(req);
    const { id } = req.params;
    const { playbookId } = req.body;

    initLists(wsId);
    const campaign = dbState.campaigns.find((c: any) => c.id === id && c.workspaceId === wsId);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found.' });

    const playbook = dbState.playbooks.find((p: any) => p.id === playbookId);
    if (!playbook) return res.status(404).json({ error: 'Playbook not found.' });

    campaign.playbookId = playbookId;
    campaign.goal = playbook.goal;
    campaign.tone = playbook.suggestedTone;
    campaign.cta = playbook.suggestedCta;
    campaign.offer = playbook.suggestedCta;

    // Clear old steps and insert sequence steps
    dbState.campaignSteps = dbState.campaignSteps.filter((s: any) => s.campaignId !== id);
    if (playbook.sampleMessaging) {
      playbook.sampleMessaging.forEach((msg: any) => {
        dbState.campaignSteps.push({
          id: `step_${Math.random().toString(36).substring(2, 11)}`,
          workspaceId: wsId,
          campaignId: id,
          stepNumber: msg.step,
          delayDays: msg.step === 1 ? 0 : 3,
          subject: msg.subject,
          body: msg.body,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      });
    }

    await persistState(wsId);
    res.json({ success: true, steps: dbState.campaignSteps.filter((s: any) => s.campaignId === id) });
  });

  // POST Run Compliance Checks
  router.post('/campaigns/:id/run-compliance', async (req: any, res) => {
    const wsId = getWorkspaceId(req);
    const { id } = req.params;
    initLists(wsId);

    try {
      const result = await runCampaignComplianceCheck(dbState, id, wsId);
      
      const checkRecord = {
        id: `chk_${Math.random().toString(36).substring(2, 11)}`,
        workspaceId: wsId,
        campaignId: id,
        passed: result.success,
        checkedBy: 'usr_marcus',
        findings: result.failures,
        runAt: new Date().toISOString()
      };
      dbState.complianceChecks.push(checkRecord);
      
      const campaign = dbState.campaigns.find((c: any) => c.id === id);
      if (campaign) {
        campaign.complianceStatus = result.success ? 'passed' : 'failed';
        if (!result.success) {
          campaign.status = 'blocked_by_compliance';
        }

        // Snapshot Hash and checked timestamp
        const steps = dbState.campaignSteps.filter((s: any) => s.campaignId === id && s.isActive !== false);
        const targetContactsIds = dbState.audienceContacts
          .filter((ac: any) => ac.audienceId === campaign.audienceId && ac.workspaceId === wsId)
          .map((ac: any) => ac.contactId);
        const audienceContactsList = dbState.contacts.filter((c: any) => targetContactsIds.includes(c.id));

        campaign.complianceSnapshotHash = computeComplianceHash(campaign, steps, audienceContactsList);
        campaign.complianceCheckedAt = new Date().toISOString();
      }

      await persistState(wsId);
      res.json({ success: result.success, failures: result.failures });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST Approve Campaign (human reviewer step)
  router.post('/campaigns/:id/approve', async (req: any, res) => {
    const wsId = getWorkspaceId(req);
    const { id } = req.params;
    initLists(wsId);

    const campaign = dbState.campaigns.find((c: any) => c.id === id && c.workspaceId === wsId);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found.' });

    campaign.approvedBy = req.user?.email || req.body.approvedBy || 'usr_marcus';
    campaign.approvedAt = new Date().toISOString();
    campaign.updatedAt = new Date().toISOString();

    await persistState(wsId);
    res.json({ success: true, approvedBy: campaign.approvedBy, approvedAt: campaign.approvedAt });
  });

  // POST Submit for Review
  router.post('/campaigns/:id/submit-review', async (req: any, res) => {
    const wsId = getWorkspaceId(req);
    const { id } = req.params;
    initLists(wsId);

    const campaign = dbState.campaigns.find((c: any) => c.id === id && c.workspaceId === wsId);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found.' });

    campaign.status = 'ready_for_review';
    await persistState(wsId);
    res.json({ success: true, status: 'ready_for_review' });
  });

  // POST Launch Campaign
  router.post('/campaigns/:id/launch', async (req: any, res) => {
    const wsId = getWorkspaceId(req);
    const { id } = req.params;
    const dryRun = req.query.dryRun === 'true';
    initLists(wsId);

    const campaign = dbState.campaigns.find((c: any) => c.id === id && c.workspaceId === wsId);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found.' });

    // Mode checking
    const mode = getProviderMode();
    
    // 1. Strict production key checks
    if (mode === 'production') {
      if (!process.env.RESEND_API_KEY) {
        return res.status(400).json({ error: 'Launch blocked: RESEND_API_KEY is missing in production mode.' });
      }
      if (!process.env.RESEND_WEBHOOK_SECRET) {
        return res.status(400).json({ error: 'Launch blocked: RESEND_WEBHOOK_SECRET is missing in production mode.' });
      }
    }

    // 2. Human approval verification
    if (!campaign.approvedAt || !campaign.approvedBy) {
      return res.status(400).json({ error: 'Campaign must be approved by a human reviewer before launching.' });
    }

    // 3. Stale compliance check verification
    if (!campaign.complianceCheckedAt || !campaign.complianceSnapshotHash) {
      return res.status(400).json({ error: 'Campaign compliance check has not been run.' });
    }

    const complianceTime = new Date(campaign.complianceCheckedAt).getTime();
    const campaignChangeTime = new Date(campaign.campaignLastChangedAt || 0).getTime();
    if (campaignChangeTime > complianceTime) {
      return res.status(400).json({ error: 'Campaign details changed since the last compliance check. Please re-run compliance.' });
    }

    const audienceChangeTime = new Date(campaign.audienceLastChangedAt || 0).getTime();
    if (audienceChangeTime > complianceTime) {
      return res.status(400).json({ error: 'Audience contacts changed since the last compliance check. Please re-run compliance.' });
    }

    // 4. Verify sending domain is still verified
    const domain = dbState.sendingDomains.find((d: any) => d.id === campaign.sendingDomainId && d.workspaceId === wsId);
    if (!domain || domain.status !== 'verified') {
      return res.status(400).json({ error: 'Selected sending domain is unverified or missing.' });
    }

    const targetContactsIds = dbState.audienceContacts
      .filter((ac: any) => ac.audienceId === campaign.audienceId && ac.workspaceId === wsId)
      .map((ac: any) => ac.contactId);
    const audienceContactsList = dbState.contacts.filter((c: any) => targetContactsIds.includes(c.id));
    const steps = dbState.campaignSteps.filter((s: any) => s.campaignId === id && s.isActive !== false);

    // 5. Compare current contacts/steps hash against compliance snapshot hash
    const currentHash = computeComplianceHash(campaign, steps, audienceContactsList);
    if (currentHash !== campaign.complianceSnapshotHash) {
      return res.status(400).json({ error: 'Audience contacts or campaign steps changed since the last compliance check. Please re-run compliance.' });
    }

    // Run dynamic compliance check to check for any prohibited lists
    try {
      const compliance = await runCampaignComplianceCheck(dbState, id, wsId);
      if (!compliance.success) {
        if (!dryRun) {
          campaign.status = 'blocked_by_compliance';
          campaign.complianceStatus = 'failed';
          await persistState(wsId);
        }
        return res.status(400).json({
          success: false,
          status: 'blocked_by_compliance',
          failures: compliance.failures
        });
      }

      const firstStep = steps.find((s: any) => s.stepNumber === 1);

      if (dryRun) {
        const skippedList: any[] = [];
        const eligibleList: any[] = [];

        for (const contact of audienceContactsList) {
          // 1. Suppression
          const isSuppressed = dbState.suppressionList.some(
            (s: any) => s.workspaceId === wsId && s.email.toLowerCase() === contact.email.toLowerCase()
          );
          if (isSuppressed) {
            skippedList.push({ contactId: contact.id, email: contact.email, reason: 'suppressed' });
            continue;
          }

          // 2. Prohibited Source
          if (PROHIBITED_SOURCES.includes(contact.source)) {
            skippedList.push({ contactId: contact.id, email: contact.email, reason: 'prohibited_source' });
            continue;
          }

          eligibleList.push({ contactId: contact.id, email: contact.email });
        }

        const expectedQueueCount = firstStep ? eligibleList.length : 0;

        return res.json({
          dryRun: true,
          success: true,
          eligibleCount: eligibleList.length,
          skippedCount: skippedList.length,
          skippedReasons: skippedList,
          expectedQueueCount
        });
      }

      campaign.status = 'active';
      campaign.complianceStatus = 'passed';
      campaign.launchDate = new Date().toISOString();

      // Enroll contacts and queue jobs
      dbState.growthSendJobs = dbState.growthSendJobs || [];

      for (const contact of audienceContactsList) {
        // Skip if suppressed
        const isSuppressed = dbState.suppressionList.some(
          (s: any) => s.workspaceId === wsId && s.email.toLowerCase() === contact.email.toLowerCase()
        );
        if (isSuppressed) continue;

        // Skip if source is prohibited
        if (PROHIBITED_SOURCES.includes(contact.source)) continue;

        // Create campaign enrollment in DB
        const enrollment = {
          id: `enr_${Math.random().toString(36).substring(2, 11)}`,
          workspaceId: wsId,
          campaignId: id,
          contactId: contact.id,
          status: 'enrolled',
          currentStep: 1,
          lastSentAt: null,
          nextSendAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        dbState.campaignEnrollments.push(enrollment);

        // Queue send job for first step
        if (firstStep) {
          dbState.growthSendJobs.push({
            id: `job_${Math.random().toString(36).substring(2, 11)}`,
            workspaceId: wsId,
            campaignId: id,
            contactId: contact.id,
            stepId: firstStep.id,
            emailMessageId: null,
            sendingDomainId: campaign.sendingDomainId || null,
            status: 'queued',
            attempts: 0,
            lastAttemptAt: null,
            nextAttemptAt: null,
            provider: 'resend',
            providerMessageId: null,
            sanitizedErrorCode: null,
            sanitizedErrorMessage: null,
            error: null,
            scheduledAt: new Date().toISOString(),
            sentAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }

      await persistState(wsId);
      res.json({ success: true, status: 'active' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST Pause Campaign
  router.post('/campaigns/:id/pause', async (req: any, res) => {
    const wsId = getWorkspaceId(req);
    const { id } = req.params;
    initLists(wsId);

    const campaign = dbState.campaigns.find((c: any) => c.id === id && c.workspaceId === wsId);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found.' });

    campaign.status = 'paused';
    campaign.pausedAt = new Date().toISOString();
    await persistState(wsId);
    res.json({ success: true, status: 'paused' });
  });

  // POST Stop Campaign
  router.post('/campaigns/:id/stop', async (req: any, res) => {
    const wsId = getWorkspaceId(req);
    const { id } = req.params;
    initLists(wsId);

    const campaign = dbState.campaigns.find((c: any) => c.id === id && c.workspaceId === wsId);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found.' });

    campaign.status = 'stopped';
    campaign.completedAt = new Date().toISOString();
    await persistState(wsId);
    res.json({ success: true, status: 'stopped' });
  });

  // GET Replies
  router.get('/replies', async (req: any, res) => {
    const wsId = getWorkspaceId(req);
    initLists(wsId);
    res.json(dbState.replies.filter((r: any) => r.workspaceId === wsId));
  });

  // Shared Helper for Inbound Reply
  const handleInboundReply = async (wsId: string, email: string, body: string, campaignId?: string) => {
    initLists(wsId);
    const contact = dbState.contacts.find(
      (c: any) => c.email.toLowerCase() === email.toLowerCase() && c.workspaceId === wsId
    );
    if (!contact) return null;

    // Stop active campaign enrollment
    const activeEnr = dbState.campaignEnrollments.find(
      (e: any) => e.contactId === contact.id && e.status === 'enrolled'
    );
    if (activeEnr) {
      activeEnr.status = 'replied';
      activeEnr.updatedAt = new Date().toISOString();
    }

    const replyId = `rep_${Math.random().toString(36).substring(2, 11)}`;
    const newReply = {
      id: replyId,
      workspaceId: wsId,
      campaignId: campaignId || activeEnr?.campaignId || '',
      contactId: contact.id,
      emailMessageId: null,
      fromEmail: email,
      toEmail: 'outreach@nestrealty.com',
      subject: 'Re: Relationship check-in',
      body,
      receivedAt: new Date().toISOString(),
      isHandled: false,
      recommendedAction: 'Schedule meeting & send splits',
      createdAt: new Date().toISOString()
    };
    dbState.replies.push(newReply);

    // Heuristic Reply Classifications
    const bodyLower = body.toLowerCase();
    let intent = 'neutral_query';
    let taskTitle = 'AI Actionable Followup: Answer prospect question';
    let taskDesc = `Prospect ${contact.firstName} replied. Check questions.`;

    if (bodyLower.includes('unsubscribe') || bodyLower.includes('stop') || bodyLower.includes('remove') || bodyLower.includes('opt out')) {
      intent = 'unsubscribe_request';
      const existSup = dbState.suppressionList.some(
        (s: any) => s.email.toLowerCase() === email.toLowerCase() && s.workspaceId === wsId
      );
      if (!existSup) {
        dbState.suppressionList.push({
          id: `sup_${Math.random().toString(36).substring(2, 11)}`,
          workspaceId: wsId,
          email: email.toLowerCase(),
          reason: 'unsubscribe',
          createdAt: new Date().toISOString()
        });
      }
    } else if (bodyLower.includes('interested') || bodyLower.includes('commission') || bodyLower.includes('split') || bodyLower.includes('call') || bodyLower.includes('lunch')) {
      intent = 'interested_agent_recruit';
      taskTitle = 'AI Actionable Followup: Call interested recruit';
      taskDesc = `Recruit ${contact.firstName} expressed interest. Book a confidential lunch.`;
    } else if (bodyLower.includes('angry') || bodyLower.includes('spam') || bodyLower.includes('f**k')) {
      intent = 'angry_or_negative';
      taskTitle = 'AI Review: Handle negative outreach response';
      taskDesc = `Prospect left negative/angry feedback. Review response details.`;
    }

    // Save classification
    dbState.replyClassifications.push({
      id: `class_${Math.random().toString(36).substring(2, 11)}`,
      workspaceId: wsId,
      replyId,
      classification: intent,
      confidence: 0.95,
      summary: taskTitle,
      createdAt: new Date().toISOString()
    });

    // Create high-priority TODO task
    let createdTaskId = null;
    if (intent !== 'unsubscribe_request') {
      const taskId = `tsk_${Math.random().toString(36).substring(2, 11)}`;
      dbState.tasks.push({
        id: taskId,
        workspaceId: wsId,
        title: taskTitle,
        description: taskDesc,
        status: 'pending',
        priority: 'high',
        assignedToRole: 'agent',
        assignedToName: 'Marcus',
        isAutomated: false,
        timeSavedMinutes: 15,
        contactId: contact.id,
        replyId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      createdTaskId = taskId;
    }

    await persistState(wsId);
    return { replyId, intent, taskId: createdTaskId };
  };

  // POST Create Manual Reply
  router.post('/replies/manual', async (req: any, res) => {
    const wsId = getWorkspaceId(req);
    const { email, body, campaignId } = req.body;
    if (!email || !body) return res.status(400).json({ error: 'Sender email and reply body are required.' });

    const result = await handleInboundReply(wsId, email, body, campaignId);
    if (!result) return res.status(404).json({ error: 'Contact not found.' });

    res.json({ success: true, ...result });
  });

  // PATCH Reply Status
  router.patch('/replies/:id', async (req: any, res) => {
    const wsId = getWorkspaceId(req);
    const { id } = req.params;
    const { isHandled } = req.body;

    initLists(wsId);
    const reply = dbState.replies.find((r: any) => r.id === id && r.workspaceId === wsId);
    if (!reply) return res.status(404).json({ error: 'Reply not found.' });

    if (isHandled !== undefined) reply.isHandled = Boolean(isHandled);
    await persistState(wsId);
    res.json(reply);
  });

  // GET Tasks
  router.get('/tasks', async (req: any, res) => {
    const wsId = getWorkspaceId(req);
    initLists(wsId);
    res.json(dbState.tasks.filter((t: any) => t.workspaceId === wsId));
  });

  // Shared Helper for task creation
  const createTask = async (req: any, res: any) => {
    const wsId = getWorkspaceId(req);
    const { title, description, priority } = req.body;
    if (!title) return res.status(400).json({ error: 'Task title is required.' });

    initLists(wsId);
    const newTask = {
      id: `tsk_${Math.random().toString(36).substring(2, 11)}`,
      workspaceId: wsId,
      title,
      description: description || '',
      status: 'pending',
      priority: priority || 'Medium',
      assignedToName: 'Marcus',
      isAutomated: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    dbState.tasks.push(newTask);
    await persistState(wsId);
    res.json(newTask);
  };

  // POST Create Task
  router.post('/tasks', createTask);
  router.post('/tasks/create', createTask);

  // Shared Helper for task status updates
  const updateTaskStatus = async (req: any, res: any) => {
    const wsId = getWorkspaceId(req);
    const { id } = req.params;
    const { status } = req.body;

    initLists(wsId);
    const task = dbState.tasks.find((t: any) => t.id === id && t.workspaceId === wsId);
    if (!task) return res.status(404).json({ error: 'Task not found.' });

    task.status = status || 'completed';
    if (task.status === 'completed') {
      task.completedAt = new Date().toISOString();
    }
    task.updatedAt = new Date().toISOString();

    await persistState(wsId);
    res.json({ success: true });
  };

  // POST Task Status (Legacy E2E)
  router.post('/tasks/:id/status', updateTaskStatus);

  // PATCH Task
  router.patch('/tasks/:id', async (req: any, res) => {
    const wsId = getWorkspaceId(req);
    const { id } = req.params;
    const { status, priority, description } = req.body;

    initLists(wsId);
    const task = dbState.tasks.find((t: any) => t.id === id && t.workspaceId === wsId);
    if (!task) return res.status(404).json({ error: 'Task not found.' });

    if (status !== undefined) {
      task.status = status;
      if (status === 'completed') {
        task.completedAt = new Date().toISOString();
      }
    }
    if (priority !== undefined) task.priority = priority;
    if (description !== undefined) task.description = description;
    task.updatedAt = new Date().toISOString();

    await persistState(wsId);
    res.json(task);
  });

  // GET Sending Domains
  router.get('/sending-domains', async (req: any, res) => {
    const wsId = getWorkspaceId(req);
    initLists(wsId);
    res.json(dbState.sendingDomains.filter((d: any) => d.workspaceId === wsId));
  });

  // POST Create Domain
  router.post('/sending-domains', async (req: any, res) => {
    const wsId = getWorkspaceId(req);
    const { domain } = req.body;
    if (!domain) return res.status(400).json({ error: 'Domain name is required.' });

    initLists(wsId);
    try {
      const setup = await provider.createDomain(domain);
      const newDomain = {
        id: setup.id,
        workspaceId: wsId,
        domain: setup.domain,
        status: setup.status,
        dnsRecords: [
          { type: 'TXT', host: '@', value: setup.spfRecord },
          { type: 'CNAME', host: 'dkim', value: setup.dkimRecord },
          { type: 'TXT', host: '_dmarc', value: setup.dmarcRecord }
        ],
        dailySendingLimit: 1000,
        isPaused: false,
        bounceWarningStatus: 'healthy',
        complaintWarningStatus: 'healthy',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      dbState.sendingDomains.push(newDomain);

      logProviderEvent(wsId, {
        provider: 'resend',
        action: 'domain_create',
        status: 'success',
        requestMetadata: { domain },
        responseMetadata: { id: setup.id, name: setup.domain, status: setup.status },
        providerObjectId: setup.id
      });

      await persistState(wsId);
      res.json(newDomain);
    } catch (err: any) {
      logProviderEvent(wsId, {
        provider: 'resend',
        action: 'domain_create',
        status: 'error',
        requestMetadata: { domain },
        responseMetadata: null,
        providerObjectId: null,
        errorCode: 'DOMAIN_CREATE_FAILURE',
        errorMessage: err.message
      });

      await persistState(wsId);
      res.status(500).json({ error: err.message });
    }
  });

  // POST Verify Domain
  router.post('/sending-domains/:id/verify', async (req: any, res) => {
    const wsId = getWorkspaceId(req);
    const { id } = req.params;

    initLists(wsId);
    const domain = dbState.sendingDomains.find((d: any) => d.id === id && d.workspaceId === wsId);
    if (!domain) return res.status(404).json({ error: 'Domain not found.' });

    try {
      const check = await provider.verifyDomain(id);
      domain.status = check.status;
      domain.lastCheckedAt = new Date().toISOString();
      domain.updatedAt = new Date().toISOString();

      logProviderEvent(wsId, {
        provider: 'resend',
        action: 'domain_verify',
        status: 'success',
        requestMetadata: { id },
        responseMetadata: { status: check.status },
        providerObjectId: id
      });

      await persistState(wsId);
      res.json(domain);
    } catch (err: any) {
      logProviderEvent(wsId, {
        provider: 'resend',
        action: 'domain_verify',
        status: 'error',
        requestMetadata: { id },
        responseMetadata: null,
        providerObjectId: null,
        errorCode: 'DOMAIN_VERIFY_FAILURE',
        errorMessage: err.message
      });

      await persistState(wsId);
      res.status(500).json({ error: err.message });
    }
  });

  // POST Pause Domain
  router.post('/sending-domains/:id/pause', async (req: any, res) => {
    const wsId = getWorkspaceId(req);
    const { id } = req.params;
    const { isPaused } = req.body;

    initLists(wsId);
    const domain = dbState.sendingDomains.find((d: any) => d.id === id && d.workspaceId === wsId);
    if (!domain) return res.status(404).json({ error: 'Domain not found.' });

    domain.isPaused = isPaused !== undefined ? Boolean(isPaused) : !domain.isPaused;
    await persistState(wsId);
    res.json(domain);
  });

  // GET Compliance Checks
  router.get('/compliance', async (req: any, res) => {
    const wsId = getWorkspaceId(req);
    initLists(wsId);
    res.json(dbState.complianceChecks.filter((c: any) => c.workspaceId === wsId));
  });

  // GET Analytics computed from actual database records
  router.get('/analytics', async (req: any, res) => {
    const wsId = getWorkspaceId(req);
    initLists(wsId);

    const emailMessages = dbState.emailMessages.filter((m: any) => m.workspaceId === wsId);
    const replies = dbState.replies.filter((r: any) => r.workspaceId === wsId);
    const tasks = dbState.tasks.filter((t: any) => t.workspaceId === wsId);

    const sent = emailMessages.filter((m: any) => m.status === 'sent' || m.sentAt).length;
    const delivered = emailMessages.filter((m: any) => m.deliveredAt).length;
    const opened = emailMessages.filter((m: any) => m.openedAt).length;
    const clicked = emailMessages.filter((m: any) => m.clickedAt).length;
    const bounced = emailMessages.filter((m: any) => m.bouncedAt || m.status === 'bounced').length;
    const complained = emailMessages.filter((m: any) => m.complainedAt || m.status === 'complained').length;
    const unsubscribed = emailMessages.filter((m: any) => m.unsubscribedAt || m.status === 'unsubscribed').length;

    const totalReplies = replies.length;
    const positiveReplies = dbState.replyClassifications.filter(
      (c: any) => c.workspaceId === wsId && c.classification === 'interested_agent_recruit'
    ).length;

    // Computed suppressed contacts
    const suppressedContacts = dbState.suppressionList.filter((s: any) => s.workspaceId === wsId).length;

    // Contacts needing follow-up: contacts that have unhandled replies or pending/open tasks
    const unhandledReplyContacts = new Set(replies.filter((r: any) => !r.isHandled).map((r: any) => r.contactId));
    const pendingTaskContacts = new Set(tasks.filter((t: any) => t.status === 'pending' || t.status === 'open').map((t: any) => t.contactId).filter(Boolean));
    const contactsNeedingFollowUp = new Set([...unhandledReplyContacts, ...pendingTaskContacts]).size;

    // Computed best playbook by positive reply rate
    const playbookStats: Record<string, { positive: number; total: number; name: string }> = {};
    const wsPlaybooks = dbState.playbooks.filter((p: any) => p.workspaceId === wsId);
    wsPlaybooks.forEach((p: any) => {
      playbookStats[p.id] = { positive: 0, total: 0, name: p.name };
    });

    const campaigns = dbState.campaigns.filter((c: any) => c.workspaceId === wsId);
    campaigns.forEach((c: any) => {
      if (!c.playbookId) return;
      if (!playbookStats[c.playbookId]) {
        const pbObj = dbState.playbooks.find((p: any) => p.id === c.playbookId);
        playbookStats[c.playbookId] = { positive: 0, total: 0, name: pbObj ? pbObj.name : 'Unknown Playbook' };
      }
      const campEmails = emailMessages.filter((m: any) => m.campaignId === c.id).length;
      playbookStats[c.playbookId].total += campEmails;
      
      const campReplies = replies.filter((r: any) => r.campaignId === c.id);
      const campPositiveReplies = dbState.replyClassifications.filter(
        (cl: any) => cl.workspaceId === wsId && cl.classification === 'interested_agent_recruit' && campReplies.some(r => r.id === cl.replyId)
      ).length;
      playbookStats[c.playbookId].positive += campPositiveReplies;
    });

    let bestPlaybook = 'None';
    let maxRate = -1;
    Object.keys(playbookStats).forEach(pbId => {
      const stats = playbookStats[pbId];
      if (stats.total > 0) {
        const rate = stats.positive / stats.total;
        if (rate > maxRate) {
          maxRate = rate;
          bestPlaybook = stats.name;
        }
      }
    });
    if (bestPlaybook === 'None' && wsPlaybooks.length > 0) {
      bestPlaybook = wsPlaybooks[0].name; // fallback to first playbook if no sends yet
    }

    res.json({
      emailsSent: sent,
      delivered,
      opens: opened,
      clicks: clicked,
      replies: totalReplies,
      positiveReplies,
      bounceRate: sent > 0 ? (bounced / sent) * 100 : 0,
      complaintRate: sent > 0 ? (complained / sent) * 100 : 0,
      unsubscribeRate: sent > 0 ? (unsubscribed / sent) * 100 : 0,
      tasksCreated: tasks.length,
      tasksCompleted: tasks.filter((t: any) => t.status === 'completed').length,
      activeCampaigns: dbState.campaigns.filter((c: any) => c.workspaceId === wsId && c.status === 'active').length,
      blockedCampaigns: dbState.campaigns.filter((c: any) => c.workspaceId === wsId && c.status === 'blocked_by_compliance').length,
      domainHealthWarnings: dbState.sendingDomains.filter((d: any) => d.workspaceId === wsId && d.status !== 'verified').length,
      suppressedContacts,
      bestPlaybook,
      contactsNeedingFollowUp
    });
  });

  // POST Inbound Webhook Callback from Resend
  router.post('/provider-events/resend', async (req: any, res) => {
    const wsId = getWorkspaceId(req);
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET || '';
    
    // Webhook Signature check
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const isValid = provider.verifyWebhookSignature(req.headers, rawBody, webhookSecret);
    if (!isValid) {
      console.warn('[Webhook] Signature verification failed.');
      logProviderEvent(wsId, {
        provider: 'resend',
        action: 'webhook_received',
        status: 'error',
        errorCode: 'WEBHOOK_SIGNATURE_INVALID',
        errorMessage: 'Signature verification failed.',
        requestMetadata: { headers: req.headers, body: rawBody }
      });
      return res.status(401).json({ error: 'Signature verification failed.' });
    }

    const svixId = req.headers['svix-id'] || req.headers['SVIX-ID'] || req.headers['svix_id'];
    initLists(wsId);

    // Idempotency: skip if svix-id has already been processed
    if (svixId) {
      const isDuplicate = dbState.emailEvents.some((e: any) => e.providerEventId === svixId);
      if (isDuplicate) {
        console.log(`[Webhook] Duplicate event detected (svix-id: ${svixId}). Skipping processing.`);
        logProviderEvent(wsId, {
          provider: 'resend',
          action: 'webhook_received',
          status: 'success',
          providerObjectId: svixId,
          requestMetadata: { svixId, duplicate: true }
        });
        return res.json({ success: true, message: 'Duplicate event ignored' });
      }
    }

    const parsed = provider.parseWebhookEvent(req.body);
    if (!parsed) {
      logProviderEvent(wsId, {
        provider: 'resend',
        action: 'webhook_received',
        status: 'error',
        errorCode: 'WEBHOOK_PARSING_FAILED',
        errorMessage: 'Invalid webhook payload.',
        requestMetadata: { body: req.body }
      });
      return res.status(400).json({ error: 'Invalid webhook payload.' });
    }

    // Find matched email message record
    const emailMsg = dbState.emailMessages.find((m: any) => m.providerMessageId === parsed.emailId);
    
    // Save to email_events
    dbState.emailEvents.push({
      id: `evt_${Math.random().toString(36).substring(2, 11)}`,
      workspaceId: emailMsg ? emailMsg.workspaceId : wsId,
      emailMessageId: emailMsg ? emailMsg.id : null,
      eventType: parsed.type,
      recipient: parsed.recipient,
      timestamp: parsed.timestamp,
      rawPayload: parsed.rawPayload,
      providerEventId: svixId || null,
      createdAt: new Date().toISOString()
    });

    if (emailMsg) {
      emailMsg.status = parsed.type;
      emailMsg[`${parsed.type}At`] = parsed.timestamp;

      // Check suppression trigger types (bounce, complain, unsubscribe)
      if (['bounced', 'complained', 'unsubscribed'].includes(parsed.type)) {
        const suppressReason = parsed.type === 'bounced' ? 'bounce' :
                               parsed.type === 'complained' ? 'complaint' : 'unsubscribe';
        
        const exist = dbState.suppressionList.some(
          (s: any) => s.email.toLowerCase() === parsed.recipient.toLowerCase() && s.workspaceId === emailMsg.workspaceId
        );
        if (!exist) {
          dbState.suppressionList.push({
            id: `sup_${Math.random().toString(36).substring(2, 11)}`,
            workspaceId: emailMsg.workspaceId,
            email: parsed.recipient.toLowerCase(),
            reason: suppressReason,
            createdAt: new Date().toISOString()
          });
        }

        // De-enroll contact from all active sequences
        const activeEnrs = dbState.campaignEnrollments.filter(
          (e: any) => e.contactId === emailMsg.contactId && e.status === 'enrolled'
        );
        activeEnrs.forEach((e: any) => {
          e.status = 'stopped';
          e.stoppedReason = suppressReason;
          e.updatedAt = new Date().toISOString();
        });
      }
    }

    logProviderEvent(wsId, {
      provider: 'resend',
      action: 'webhook_received',
      status: 'success',
      providerObjectId: svixId || null,
      requestMetadata: { eventType: parsed.type, recipient: parsed.recipient }
    });

    await persistState(wsId);
    res.json({ success: true });
  });

  // Webhook Simulation endpoint (for local Playwright tests & dashboard simulations)
  router.post('/webhook/simulate', async (req: any, res) => {
    const wsId = getWorkspaceId(req);
    const { type, email, body, campaignId } = req.body;

    if (type === 'reply') {
      const result = await handleInboundReply(wsId, email, body || 'I am interested in recruiting options!', campaignId);
      if (!result) return res.status(404).json({ error: 'Contact not found for this email address.' });
      return res.json({ success: true, classification: result.intent, taskId: result.taskId, replyId: result.replyId });
    }

    res.status(400).json({ error: 'Simulation type not supported or missing arguments.' });
  });

  // Legacy compat overlays for Playwright tests
  router.get('/prospects', async (req: any, res) => {
    const wsId = getWorkspaceId(req);
    initLists(wsId);
    const recruits = dbState.contacts.filter((c: any) => c.contactType === 'agent_recruit' && c.workspaceId === wsId);
    const mapped = recruits.map((c: any) => ({
      id: c.id,
      name: `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Unnamed',
      current_brokerage: c.company || '',
      annual_volume: Number(c.annualVolume || c.annual_volume) || 0,
      production_segment: getProductionSegment(Number(c.annualVolume || c.annual_volume) || 0),
      stage: c.stage || 'Target',
      email: c.email,
      phone: c.phone || '',
      last_contact: c.updatedAt || new Date().toISOString(),
      notes: c.notes || c.sourceDetail || '',
      priority: c.priority || 'Medium',
      last_action: c.lastAction || 'Prospect Identified'
    }));
    res.json(mapped);
  });

  router.post('/prospects', async (req: any, res) => {
    const wsId = getWorkspaceId(req);
    const { name, current_brokerage, annual_volume, email, phone, notes, priority } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email are required.' });

    initLists(wsId);
    const parts = name.trim().split(/\s+/);
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';

    const newContact = {
      id: `con_${Math.random().toString(36).substring(2, 11)}`,
      workspaceId: wsId,
      email: email.toLowerCase(),
      firstName,
      lastName,
      phone: phone || '',
      company: current_brokerage || '',
      contactType: 'agent_recruit',
      source: 'manual_input',
      annualVolume: Number(annual_volume) || 0,
      stage: 'Target',
      priority: priority || 'Medium',
      notes: notes || '',
      lastAction: 'Prospect Identified',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    dbState.contacts.push(newContact);
    await persistState(wsId);

    res.json({
      id: newContact.id,
      name,
      current_brokerage,
      annual_volume,
      production_segment: getProductionSegment(annual_volume),
      stage: 'Target',
      email,
      phone,
      last_contact: newContact.createdAt,
      notes,
      priority,
      last_action: 'Prospect Identified'
    });
  });

  router.post('/prospects/:id/stage', async (req: any, res) => {
    const wsId = getWorkspaceId(req);
    const { id } = req.params;
    const { stage } = req.body;

    initLists(wsId);
    const contact = dbState.contacts.find((c: any) => c.id === id && c.workspaceId === wsId);
    if (!contact) return res.status(404).json({ error: 'Contact not found.' });

    contact.stage = stage;
    contact.lastAction = `Stage changed to ${stage}`;
    contact.updatedAt = new Date().toISOString();
    await persistState(wsId);
    res.json({ success: true });
  });

  router.get('/metrics', async (req: any, res) => {
    const wsId = getWorkspaceId(req);
    initLists(wsId);
    res.json({
      totalContacts: dbState.contacts.filter((c: any) => c.workspaceId === wsId).length,
      activeCampaigns: dbState.campaigns.filter((c: any) => c.workspaceId === wsId && c.status === 'active').length,
      operatorTasks: dbState.tasks.filter((t: any) => t.workspaceId === wsId && t.status === 'pending').length
    });
  });

  router.get('/channels', async (req: any, res) => {
    res.json([
      {
        id: 'chan_mls',
        name: 'RESO MLS Active Sync Feed',
        category: 'MLS Integration',
        description: 'Synchronizes production metrics and transaction counts directly from the local MLS RESO Web API server.',
        connected: true,
        last_sync: new Date().toISOString(),
        records_synchronized: 1450,
        errors_count: 0,
        priority: 'High'
      },
      {
        id: 'chan_linkedin',
        name: 'LinkedIn Sales Navigator Sync',
        category: 'Social Networks',
        description: 'Auto-scans agent experience shifts, brokerage changes, and career update alerts.',
        connected: false,
        last_sync: null,
        records_synchronized: 0,
        errors_count: 0,
        priority: 'Medium'
      }
    ]);
  });

  router.post('/sync', async (req: any, res) => {
    const wsId = getWorkspaceId(req);
    initLists(wsId);
    res.json({ success: true });
  });

  // POST Process Queued Email Jobs
  router.post('/jobs/process', async (req: any, res) => {
    const wsId = getWorkspaceId(req);
    initLists(wsId);

    dbState.growthSendJobs = dbState.growthSendJobs || [];
    dbState.emailMessages = dbState.emailMessages || [];
    dbState.providerLogs = dbState.providerLogs || [];

    const now = new Date();
    const jobs = dbState.growthSendJobs.filter((j: any) => {
      if (j.workspaceId !== wsId) return false;
      const isEligibleStatus = j.status === 'queued' || j.status === 'sending' || j.status === 'failed_retry';
      if (!isEligibleStatus) return false;
      if (j.nextAttemptAt && new Date(j.nextAttemptAt) > now) return false;
      return true;
    });

    const mode = getProviderMode();
    const activeProvider = getEmailProvider();
    let processedCount = 0;

    for (const job of jobs) {
      const campaign = dbState.campaigns.find((c: any) => c.id === job.campaignId && c.workspaceId === wsId);
      const contact = dbState.contacts.find((c: any) => c.id === job.contactId && c.workspaceId === wsId);
      const step = dbState.campaignSteps.find((s: any) => s.id === job.stepId && s.workspaceId === wsId);

      // Initialize job columns if not defined
      job.attempts = job.attempts || 0;
      job.sendingDomainId = campaign?.sendingDomainId || null;
      job.provider = 'resend';

      if (!campaign || !contact || !step) {
        job.status = 'failed';
        job.error = 'Missing campaign, contact, or step records.';
        job.sanitizedErrorCode = 'MISSING_RECORDS';
        job.sanitizedErrorMessage = job.error;
        job.updatedAt = new Date().toISOString();
        continue;
      }

      // Check campaign pause/stop status
      if (campaign.status === 'paused' || campaign.status === 'stopped' || campaign.status === 'draft') {
        job.status = 'skipped_paused_campaign';
        job.updatedAt = new Date().toISOString();
        continue;
      }

      // Check suppressed contacts
      const isSuppressed = dbState.suppressionList.some(
        (s: any) => s.workspaceId === wsId && s.email.toLowerCase() === contact.email.toLowerCase()
      );
      if (isSuppressed) {
        job.status = 'skipped_suppressed';
        job.updatedAt = new Date().toISOString();
        continue;
      }

      // Check dynamic compliance check
      if (PROHIBITED_SOURCES.includes(contact.source)) {
        job.status = 'skipped_compliance';
        job.updatedAt = new Date().toISOString();
        continue;
      }

      // Verify current contacts/steps hash against compliance snapshot hash (compliance freshness)
      const targetContactsIds = dbState.audienceContacts
        .filter((ac: any) => ac.audienceId === campaign.audienceId && ac.workspaceId === wsId)
        .map((ac: any) => ac.contactId);
      const audienceContactsList = dbState.contacts.filter((c: any) => targetContactsIds.includes(c.id));
      const steps = dbState.campaignSteps.filter((s: any) => s.campaignId === campaign.id && s.isActive !== false);
      const currentHash = computeComplianceHash(campaign, steps, audienceContactsList);
      if (currentHash !== campaign.complianceSnapshotHash) {
        job.status = 'skipped_stale_compliance';
        job.error = 'Audience contacts or campaign steps changed since the last compliance check.';
        job.sanitizedErrorCode = 'STALE_COMPLIANCE';
        job.sanitizedErrorMessage = job.error;
        job.updatedAt = new Date().toISOString();
        continue;
      }

      // Check sending domain verified status
      const domain = dbState.sendingDomains.find((d: any) => d.id === campaign.sendingDomainId && d.workspaceId === wsId);
      if (domain && domain.isPaused) {
        job.status = 'skipped_paused_domain';
        job.updatedAt = new Date().toISOString();
        continue;
      }

      if (mode === 'production') {
        if (!domain || domain.status !== 'verified') {
          job.status = 'skipped_unverified_domain';
          job.error = 'Selected sending domain is unverified or missing in production mode.';
          job.sanitizedErrorCode = 'UNVERIFIED_DOMAIN';
          job.sanitizedErrorMessage = job.error;
          job.updatedAt = new Date().toISOString();
          continue;
        }
      }

      // Check rate limit controls:
      const today = new Date();
      today.setHours(0,0,0,0);
      const startOfDay = today.toISOString();

      const wsDailyLimit = 500;
      const domainDailyLimit = 100;
      const campaignDailyLimit = 200;

      const wsSentTodayCount = dbState.emailMessages.filter(
        (m: any) => m.workspaceId === wsId && m.sentAt && m.sentAt >= startOfDay
      ).length;

      const domainSentTodayCount = domain ? dbState.emailMessages.filter(
        (m: any) => m.workspaceId === wsId && m.sentAt && m.sentAt >= startOfDay && m.fromEmail.endsWith(domain.domain)
      ).length : 0;

      const campaignSentTodayCount = dbState.emailMessages.filter(
        (m: any) => m.workspaceId === wsId && m.sentAt && m.sentAt >= startOfDay && m.campaignId === campaign.id
      ).length;

      if (wsSentTodayCount >= wsDailyLimit || (domain && domainSentTodayCount >= domainDailyLimit) || campaignSentTodayCount >= campaignDailyLimit) {
        job.status = 'skipped_rate_limited';
        job.updatedAt = new Date().toISOString();
        continue;
      }

      // Update status to 'sending' before calling provider to prevent double-sends (concurrency protection)
      job.attempts = (job.attempts || 0) + 1;
      job.lastAttemptAt = new Date().toISOString();
      job.status = 'sending';
      job.updatedAt = new Date().toISOString();

      // Generate unsubscribe token
      const token = generateUnsubscribeToken(wsId, contact.id, campaign.id);
      const appUrl = process.env.APP_PUBLIC_URL || `http://localhost:${req.socket.localPort || 3557}`;
      const unsubLink = `${appUrl}/unsubscribe/${token}`;
      const bodyWithUnsub = `${step.body}<br/><br/><hr/><p style="font-size:12px;color:#666;">If you no longer wish to receive these emails, you can <a href="${unsubLink}">unsubscribe here</a>.</p>`;

      const fromEmail = domain ? `outreach@${domain.domain}` : `outreach@nestrealty.com`;

      try {
        const sendResult = await activeProvider.sendEmail({
          to: contact.email,
          from: fromEmail,
          subject: step.subject,
          body: bodyWithUnsub,
          headers: {
            'List-Unsubscribe': `<${unsubLink}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
          }
        });

        // Add email message to dbState
        const messageId = `msg_${Math.random().toString(36).substring(2, 11)}`;
        dbState.emailMessages.push({
          id: messageId,
          workspaceId: wsId,
          campaignId: campaign.id,
          campaignStepId: step.id,
          contactId: contact.id,
          provider: 'resend',
          providerMessageId: sendResult.messageId || null,
          fromEmail,
          toEmail: contact.email,
          subject: step.subject,
          body: bodyWithUnsub,
          status: 'sent',
          sentAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        });

        // Update campaign enrollment status
        const enrollment = dbState.campaignEnrollments.find(
          (e: any) => e.campaignId === campaign.id && e.contactId === contact.id
        );
        if (enrollment) {
          enrollment.lastSentAt = new Date().toISOString();
          enrollment.updatedAt = new Date().toISOString();
        }

        // Add provider log
        logProviderEvent(wsId, {
          provider: 'resend',
          mode: mode,
          action: 'email_send',
          status: 'success',
          requestMetadata: { to: contact.email, from: fromEmail },
          responseMetadata: { providerMessageId: sendResult.messageId },
          providerObjectId: sendResult.messageId || null
        });

        job.status = 'sent';
        job.sentAt = new Date().toISOString();
        job.emailMessageId = messageId;
        job.providerMessageId = sendResult.messageId || null;
        job.sanitizedErrorCode = null;
        job.sanitizedErrorMessage = null;
        job.updatedAt = new Date().toISOString();
        processedCount++;
      } catch (err: any) {
        // Sanitize error code and message
        const errCode = err.code || 'SEND_EMAIL_FAILURE';
        const errMessage = err.message || 'Unknown provider error';

        logProviderEvent(wsId, {
          provider: 'resend',
          mode: mode,
          action: 'email_send',
          status: 'error',
          requestMetadata: { to: contact.email, from: fromEmail },
          responseMetadata: null,
          providerObjectId: null,
          errorCode: errCode,
          errorMessage: errMessage
        });

        job.sanitizedErrorCode = errCode;
        job.sanitizedErrorMessage = errMessage;
        job.error = errMessage;

        // Exponential backoff retry logic (max 3 attempts) for transient errors only
        const isTransient = errMessage.includes('rate limit') || errMessage.includes('timeout') || errMessage.includes('500') || errMessage.includes('502') || errMessage.includes('503') || errMessage.includes('504') || errMessage.includes('network') || errMessage.includes('temporary');
        if (isTransient && job.attempts < 3) {
          job.status = 'failed_retry';
          const backoffMinutes = Math.pow(2, job.attempts);
          job.nextAttemptAt = new Date(Date.now() + backoffMinutes * 60 * 1000).toISOString();
        } else {
          job.status = 'failed';
        }
        job.updatedAt = new Date().toISOString();
      }
    }

    await persistState(wsId);
    res.json({ success: true, processedCount });
  });

  // Testing-only environment override endpoint (strictly locked to test environment)
  const isTestMode = process.env.NODE_ENV === 'test' || process.env.GROWTH_TEST_MODE === 'true';
  const isProductionMode = process.env.APP_MODE === 'production' || process.env.NODE_ENV === 'production';
  if (isTestMode && !isProductionMode) {
    router.post('/test/override-env', (req: any, res) => {
      const { mode, apiKey, webhookSecret } = req.body;
      if (mode !== undefined) process.env.GROWTH_EMAIL_PROVIDER_MODE = mode;
      if (apiKey !== undefined) process.env.RESEND_API_KEY = apiKey;
      if (webhookSecret !== undefined) process.env.RESEND_WEBHOOK_SECRET = webhookSecret;
      res.json({
        mode: process.env.GROWTH_EMAIL_PROVIDER_MODE,
        apiKey: !!process.env.RESEND_API_KEY,
        webhookSecret: !!process.env.RESEND_WEBHOOK_SECRET
      });
    });
  }

  const getProductionSegment = (vol: number) => {
    if (vol >= 10000000) return 'High-Producers $10M+';
    if (vol >= 5000000) return 'Mid-Producers $5M-$10M';
    return 'Rookies <$5M';
  };

  return router;
}
