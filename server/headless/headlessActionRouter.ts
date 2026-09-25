import express from 'express';
import crypto from 'crypto';
import { resolveHeadlessAction, completeHeadlessAction } from './headlessActionRules.js';
import { logHeadlessAudit } from './headlessActionAudit.js';
import { evaluateOwnerShieldRules, runOwnerShieldForWorkItem } from './ownerShield.js';
import { classifySignal } from './aiTriage.js';
import { dispatchWebhookEvent } from './webhookDispatcher.js';
import { renderBaseEmailLayout } from '../notifications/emailTemplates/baseEmailLayout.js';
import { requireAuth } from '../auth/auth.js';

export function getHeadlessActionRouter(dbState: any, persistState: () => void) {
  const router = express.Router();

  // GET RESOLVE HEADLESS ACTION BY TOKEN
  router.get('/action/:token', (req, res) => {
    const token = req.params.token;
    const action = resolveHeadlessAction(dbState, token);

    if (!action) {
      res.status(404).json({ success: false, error: 'Link expired or invalid.' });
      return;
    }

    let details: any = null;
    if (action.sourceType === 'work_item') {
      details = (dbState.workItems || []).find((w: any) => w.id === action.sourceId);
    } else if (action.sourceType === 'approval') {
      details = (dbState.decisions || []).find((d: any) => d.id === action.sourceId) ||
                (dbState.actionProposals || []).find((p: any) => p.id === action.sourceId);
    }

    res.json({
      success: true,
      actionId: action.id,
      actionType: action.actionType,
      sourceType: action.sourceType,
      sourceId: action.sourceId,
      status: action.status,
      expiresAt: action.expiresAt,
      recipientStaffMemberId: action.recipientStaffMemberId,
      recipientClientId: action.recipientClientId,
      recipientAgentId: action.recipientAgentId,
      details
    });
  });

  // POST COMPLETE HEADLESS ACTION
  router.post('/action/:token/complete', (req, res) => {
    const token = req.params.token;
    const { actionResult, notes } = req.body;

    const action = resolveHeadlessAction(dbState, token);
    if (!action) {
      res.status(404).json({ success: false, error: 'Link expired or invalid.' });
      return;
    }

    const completed = completeHeadlessAction(dbState, token);
    if (!completed) {
      res.status(400).json({ success: false, error: 'Action could not be completed.' });
      return;
    }

    // Mutate the underlying source if relevant
    if (action.sourceType === 'work_item') {
      const workItem = (dbState.workItems || []).find((w: any) => w.id === action.sourceId);
      if (workItem) {
        workItem.status = 'completed';
        workItem.completedAt = new Date().toISOString();
        if (notes) {
          if (!workItem.notes) workItem.notes = [];
          workItem.notes.push({
            id: `n_${Date.now()}`,
            text: notes,
            createdAt: new Date().toISOString(),
            author: 'External Action Portal'
          });
        }
      }
    } else if (action.sourceType === 'approval') {
      const decision = (dbState.decisions || []).find((d: any) => d.id === action.sourceId);
      if (decision) {
        decision.status = actionResult === 'reject' ? 'rejected' : 'approved';
        decision.actedAt = new Date().toISOString();
      }
      const proposal = (dbState.actionProposals || []).find((p: any) => p.id === action.sourceId);
      if (proposal) {
        proposal.status = actionResult === 'reject' ? 'rejected' : 'approved';
        proposal.actedAt = new Date().toISOString();
      }
    }

    persistState();

    // Dispatch webhook events
    const eventType = action.sourceType === 'work_item' ? 'work_item_completed' : 'approval_granted';
    dispatchWebhookEvent(dbState, eventType, {
      actionId: action.id,
      sourceType: action.sourceType,
      sourceId: action.sourceId,
      result: actionResult || 'completed',
      notes
    });

    res.json({ success: true, message: 'Action completed successfully.' });
  });

  // GET LIST OF HEADLESS ACTIONS
  router.get('/actions/list', (req, res) => {
    res.json({ success: true, actions: dbState.headlessActions || [] });
  });

  // GET STAFF PREFERENCES
  router.get('/preferences/:staffMemberId', (req, res) => {
    const staffId = req.params.staffMemberId;
    if (!dbState.staffPreferences) dbState.staffPreferences = [];

    let pref = dbState.staffPreferences.find((p: any) => p.staffMemberId === staffId);
    if (!pref) {
      pref = {
        staffMemberId: staffId,
        emailEnabled: true,
        smsEnabled: true,
        preferredChannel: 'both',
        timezone: 'America/New_York'
      };
      dbState.staffPreferences.push(pref);
      persistState();
    }

    res.json({ success: true, preference: pref });
  });

  // POST UPDATE STAFF PREFERENCES
  router.post('/preferences/update', (req, res) => {
    const { staffMemberId, emailEnabled, smsEnabled, preferredChannel, quietHoursStart, quietHoursEnd, timezone } = req.body;
    if (!staffMemberId) {
      res.status(400).json({ success: false, error: 'staffMemberId is required.' });
      return;
    }

    if (!dbState.staffPreferences) dbState.staffPreferences = [];
    let pref = dbState.staffPreferences.find((p: any) => p.staffMemberId === staffMemberId);
    if (!pref) {
      pref = { staffMemberId };
      dbState.staffPreferences.push(pref);
    }

    pref.emailEnabled = !!emailEnabled;
    pref.smsEnabled = !!smsEnabled;
    pref.preferredChannel = preferredChannel || 'both';
    pref.quietHoursStart = quietHoursStart;
    pref.quietHoursEnd = quietHoursEnd;
    pref.timezone = timezone || 'America/New_York';

    persistState();
    res.json({ success: true, preference: pref });
  });

  // GET BRANDING
  router.get('/branding', (req, res) => {
    res.json({
      success: true,
      branding: dbState.branding || {
        brokerageName: 'Nest Realty Wilmington',
        primaryColor: '#18382b'
      }
    });
  });

  // POST BRANDING UPDATE
  router.post('/branding/update', (req, res) => {
    const { brokerageName, logoUrl, primaryColor, emailHeaderLogo, secureActionPageBrand, clientPortalBrand, replyToEmail, notificationFooter } = req.body;
    dbState.branding = {
      brokerageName: brokerageName || 'Nest Realty Wilmington',
      logoUrl,
      primaryColor: primaryColor || '#18382b',
      emailHeaderLogo,
      secureActionPageBrand,
      clientPortalBrand,
      replyToEmail,
      notificationFooter
    };
    persistState();
    res.json({ success: true, branding: dbState.branding });
  });

  // GET CLIENT PORTALS
  router.get('/client-portal/list', (req, res) => {
    res.json({ success: true, portals: dbState.clientPortals || [] });
  });

  // POST CREATE CLIENT PORTAL
  router.post('/client-portal/create', (req, res) => {
    const { dealId, clientName, clientEmail, clientPhone } = req.body;
    if (!dealId || !clientName) {
      res.status(400).json({ success: false, error: 'dealId and clientName are required.' });
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 day access

    const newPortal = {
      id: `cp_${Date.now()}`,
      workspaceId: 'nest-realty-demo',
      dealId,
      clientName,
      clientEmail,
      clientPhone,
      tokenHash,
      expiresAt,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    if (!dbState.clientPortals) dbState.clientPortals = [];
    dbState.clientPortals.push(newPortal);
    persistState();

    logHeadlessAudit(
      dbState,
      'System',
      'system',
      `Created client deal portal token for deal ID: ${dealId}`,
      'security'
    );

    res.json({ success: true, portal: newPortal, token });
  });

  // GET AGENT PORTALS
  router.get('/agent-portal/list', (req, res) => {
    res.json({ success: true, portals: dbState.agentPortals || [] });
  });

  // POST CREATE AGENT PORTAL
  router.post('/agent-portal/create', (req, res) => {
    const { agentId, actionId } = req.body;
    if (!agentId || !actionId) {
      res.status(400).json({ success: false, error: 'agentId and actionId are required.' });
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 day access

    const newPortal = {
      id: `ap_${Date.now()}`,
      workspaceId: 'nest-realty-demo',
      agentId,
      actionId,
      tokenHash,
      expiresAt,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    if (!dbState.agentPortals) dbState.agentPortals = [];
    dbState.agentPortals.push(newPortal);
    persistState();

    res.json({ success: true, portal: newPortal, token });
  });

  // GET WEBHOOKS
  router.get('/webhooks/list', (req, res) => {
    res.json({ success: true, webhooks: dbState.webhooks || [] });
  });

  // POST CREATE WEBHOOK
  router.post('/webhooks/create', (req, res) => {
    const { targetUrl, events } = req.body;
    if (!targetUrl || !events || !events.length) {
      res.status(400).json({ success: false, error: 'targetUrl and events are required.' });
      return;
    }

    const secret = crypto.randomBytes(24).toString('hex');
    const secretHash = crypto.createHash('sha256').update(secret).digest('hex');

    const newSub = {
      id: `wh_${Date.now()}`,
      workspaceId: 'nest-realty-demo',
      targetUrl,
      events,
      secretHash,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    if (!dbState.webhooks) dbState.webhooks = [];
    dbState.webhooks.push(newSub);
    persistState();

    res.json({ success: true, webhook: newSub, secret });
  });

  // POST DELETE WEBHOOK
  router.post('/webhooks/delete', (req, res) => {
    const { id } = req.body;
    if (!id) {
      res.status(400).json({ success: false, error: 'id is required.' });
      return;
    }

    if (dbState.webhooks) {
      dbState.webhooks = dbState.webhooks.filter((w: any) => w.id !== id);
      persistState();
    }

    res.json({ success: true });
  });

  // POST SUBMIT SMART INTAKE
  router.post('/intake/submit', (req, res) => {
    const { title, description, type } = req.body;
    if (!title) {
      res.status(400).json({ success: false, error: 'title is required.' });
      return;
    }

    const ALLOWED_INTAKE_TYPES = ['marketing', 'compliance', 'office', 'support'];
    if (!type || !ALLOWED_INTAKE_TYPES.includes(type)) {
      res.status(400).json({ success: false, error: `Invalid intake type: ${type}. Allowed types: ${ALLOWED_INTAKE_TYPES.join(', ')}` });
      return;
    }

    // Determine Work Item type and owner role
    let itemType = 'general';
    let ownerRole = 'operations_lead';

    if (type === 'marketing') {
      itemType = 'marketing';
      ownerRole = 'marketing_coordinator';
    } else if (type === 'compliance') {
      itemType = 'compliance';
      ownerRole = 'operations_lead';
    } else if (type === 'office') {
      itemType = 'office_signage';
      ownerRole = 'maintenance';
    } else if (type === 'support') {
      itemType = 'general';
      ownerRole = 'operations_lead';
    }

    const newWorkItem = {
      id: `wi_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      workspaceId: 'nest-realty-demo',
      title,
      description: description || '',
      type: itemType,
      priority: 'medium',
      status: 'pending',
      ownerRole,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (!dbState.workItems) dbState.workItems = [];
    dbState.workItems.push(newWorkItem);
    
    // Evaluate via Owner Shield
    runOwnerShieldForWorkItem(dbState, newWorkItem);

    persistState();

    logHeadlessAudit(
      dbState,
      'System',
      'system',
      `Smart intake created Work Item ID: ${newWorkItem.id} for type: ${type}`,
      'workflows'
    );

    res.json({ success: true, workItemId: newWorkItem.id });
  });

  // GET OWNER SHIELD METRICS
  router.get('/owner-shield', (req, res) => {
    const metrics = evaluateOwnerShieldRules(dbState);
    res.json({ success: true, metrics });
  });

  // POST CLASSIFY AI TRIAGE SIGNAL
  router.post('/triage/classify', (req, res) => {
    const { signalText } = req.body;
    if (!signalText) {
      res.status(400).json({ success: false, error: 'signalText is required.' });
      return;
    }

    const classification = classifySignal(signalText);

    // If human review is not needed and it matches a target queue, create a Work Item
    let workItemId: string | undefined;
    if (!classification.requiresHumanReview) {
      const newWorkItem = {
        id: `wi_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        workspaceId: 'nest-realty-demo',
        title: `AI Triage: ${signalText.substring(0, 50)}...`,
        description: `Source Signal: "${signalText}"\nNotes: ${classification.triageNotes}`,
        type: classification.category === 'facilities' ? 'office_signage' : classification.category,
        priority: classification.suggestedPriority,
        status: 'pending',
        ownerRole: classification.routedQueue,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (!dbState.workItems) dbState.workItems = [];
      dbState.workItems.push(newWorkItem);
      
      // Evaluate via Owner Shield
      runOwnerShieldForWorkItem(dbState, newWorkItem);
      
      persistState();
      workItemId = newWorkItem.id;
    }

    res.json({ success: true, classification, workItemId });
  });

  // GET VERIFY PREVIEW TOKEN
  router.get('/verify-preview-token', (req, res) => {
    const isProduction = process.env.APP_MODE === 'production' || process.env.NODE_ENV === 'production';
    if (!isProduction) {
      return res.json({ success: true });
    }
    const token = req.query.token;
    const expectedToken = process.env.NOTIFICATION_PREVIEW_TOKEN;
    if (!expectedToken || token !== expectedToken) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Invalid preview token.' });
    }
    res.json({ success: true });
  });

  const MOCK_ACTION_URL = 'http://127.0.0.1:3000/client/deal/mock-client-deal-token';

  const notificationCatalog: Record<string, { subject: string; headline: string; summary: string; whyItMatters?: string; recommendedAction?: string; ctaLabel?: string; typeLabel?: string; assignedTo?: string; dueText?: string; smsBody: string }> = {
    client_portal_invite: {
      subject: 'Invitation: Access your Client Deal Portal for 109 Woodlawn Avenue',
      headline: 'Your secure deal portal is ready',
      summary: 'We created a private, secure portal for your transaction at 109 Woodlawn Avenue. You can view progress, upload requested documents, and send messages directly to your coordinator.',
      whyItMatters: 'Ensures secure collection of disclosures and wire receipts without exposing email vectors.',
      recommendedAction: 'Enter Deal Portal to upload the signed Seller Disclosures Addendum.',
      ctaLabel: 'Access Deal Portal',
      typeLabel: 'Portal Invitation',
      smsBody: `shapework: Secure Client Deal Portal is ready. Access: ${MOCK_ACTION_URL}`
    },
    agent_action_portal: {
      subject: 'Pending Action: MLS Listing Upload Verification',
      headline: 'MLS Verification Pending',
      summary: 'Please confirm that all compliance forms for 123 Oak Street are uploaded to MLS and submit your screenshot.',
      whyItMatters: 'Required for compliance audit and timely listing launch.',
      recommendedAction: 'Verify MLS Status and upload screenshot.',
      ctaLabel: 'Confirm Verification',
      typeLabel: 'Agent Action Alert',
      smsBody: `shapework: Pending action: MLS Verification. Confirm: ${MOCK_ACTION_URL}`
    },
    smart_intake_link: {
      subject: 'Smart Intake Portal: Marketing Design Request',
      headline: 'Submit your marketing request',
      summary: 'Use this secure intake form to submit details for flyer layouts, photography coordinates, and listing launch calendars.',
      whyItMatters: 'Standardizes intake requirements and auto-assigns to the marketing queue.',
      recommendedAction: 'Open Smart Intake Form to upload flyer photos.',
      ctaLabel: 'Open Intake Portal',
      typeLabel: 'Intake Portal Link',
      smsBody: `shapework: Open Smart Intake Form: Marketing. Submit: ${MOCK_ACTION_URL}`
    },
    owner_shield_review: {
      subject: 'Alert: Owner Shield Review Needed',
      headline: 'Items Shielded & Held for Digest',
      summary: 'Owner Shield deflected 5 routine tasks and held 2 items for your weekly digest, protecting your focus from routine operations.',
      whyItMatters: 'Ensures compliance overrides and shield rules remain transparent.',
      recommendedAction: 'Review Shield Decisions in the Command Center.',
      ctaLabel: 'View Shield Log',
      typeLabel: 'Shield Deflection Summary',
      smsBody: `shapework: Alert: Owner Shield Deflection Log is ready. View: ${MOCK_ACTION_URL}`
    },
    triage_low_confidence: {
      subject: 'Triage Review: Action Required on Incoming Signal',
      headline: 'Incoming Signal Needs Human Triage',
      summary: 'A low-confidence message was received. The system could not auto-classify its priority or category with high confidence.',
      whyItMatters: 'Prevents misrouted notifications or missed critical escalations.',
      recommendedAction: 'Manually Classify Signal and assign queue.',
      ctaLabel: 'Review Signal',
      typeLabel: 'Triage Queue Alert',
      smsBody: `shapework: Action needed: Signal needs human classification. Review: ${MOCK_ACTION_URL}`
    },
    webhook_delivery_failure: {
      subject: 'Alert: Webhook Delivery Failure for Endpoints',
      headline: 'Webhook Delivery Retries Exhausted',
      summary: 'The webhook endpoint http://api.external-brokerage.com/callback failed repeatedly with 554 Host Unreachable.',
      whyItMatters: 'Third-party transaction systems will not sync until connections are restored.',
      recommendedAction: 'Inspect Webhook Logs and re-enable subscription.',
      ctaLabel: 'Check Connection',
      typeLabel: 'System Integration Alert',
      smsBody: `shapework: Connection issue: Webhook delivery failed. Details: ${MOCK_ACTION_URL}`
    },
    upload_received: {
      subject: 'Confirmation: Document Upload Received',
      headline: 'Document uploaded successfully',
      summary: 'We received your upload: seller_disclosures_signed.pdf for 109 Woodlawn Avenue. Our compliance coordinators will review it shortly.',
      whyItMatters: 'Keeps transaction logs synchronized and provides upload receipt confirmation.',
      recommendedAction: 'Check Deal Status in the client portal.',
      ctaLabel: 'View Progress',
      typeLabel: 'Document Confirmation',
      smsBody: `shapework: Upload received: seller_disclosures_signed.pdf. Track: ${MOCK_ACTION_URL}`
    },
    deal_status_changed: {
      subject: 'Notice: Status updated for 109 Woodlawn Avenue',
      headline: 'Status changed: Compliance Audit',
      summary: 'The status of your transaction at 109 Woodlawn Avenue has been updated from Listing Prep to Compliance Audit.',
      whyItMatters: 'Ensures all parties are aligned on active transaction milestones.',
      recommendedAction: 'View Active Checklist in the client portal.',
      ctaLabel: 'View Transaction',
      typeLabel: 'Transaction Update',
      smsBody: `shapework: Status changed to Compliance Audit. View: ${MOCK_ACTION_URL}`
    },
    compliance_issue_flagged: {
      subject: 'Action Required: Escrow Addendum Correction Needed',
      headline: 'Compliance issue flagged',
      summary: 'The Escrow Addendum uploaded for 109 Woodlawn Avenue was rejected: missing broker signature on page 4.',
      whyItMatters: 'Closing check releases are paused until compliance is fully cleared.',
      recommendedAction: 'Upload Corrected Document with broker signature.',
      ctaLabel: 'Resolve Compliance Issue',
      typeLabel: 'Compliance Flag Alert',
      smsBody: `shapework: Correction needed on Escrow Addendum. Resolve: ${MOCK_ACTION_URL}`
    },
    support_request_received: {
      subject: 'Received: Help Desk Request #10294',
      headline: 'Support request triaged',
      summary: 'Your help desk ticket regarding lockbox keys has been received and assigned to the facilities maintenance queue.',
      whyItMatters: 'Ensures all agent assistance requests are logged and tracked to resolution.',
      recommendedAction: 'Track Ticket Progress in the support portal.',
      ctaLabel: 'View Support Ticket',
      typeLabel: 'Help Desk Acknowledgment',
      smsBody: `shapework: Support ticket #10294 assigned to facilities. View: ${MOCK_ACTION_URL}`
    },
    pilot_welcome: {
      subject: 'Welcome: Your shapework. Pilot Workspace is ready',
      headline: 'Activate your Headless Operating Layer',
      summary: 'Welcome to the shapework. pilot program. Your workspace has been initialized with pilot rules and Owner Shield deflection configurations.',
      whyItMatters: 'Your team can now run headless action loops and signed webhook dispatches.',
      recommendedAction: 'Access Pilot Console to configure settings.',
      ctaLabel: 'Get Started',
      typeLabel: 'Pilot Welcome Notice',
      smsBody: `shapework: Welcome to the shapework. Pilot Workspace! Access: ${MOCK_ACTION_URL}`
    }
  };

  // GET NOTIFICATION PREVIEWS
  router.get('/notification-previews', (req, res) => {
    const isProduction = process.env.APP_MODE === 'production' || process.env.NODE_ENV === 'production';
    if (isProduction) {
      const token = req.query.token;
      const expectedToken = process.env.NOTIFICATION_PREVIEW_TOKEN;
      if (!expectedToken || token !== expectedToken) {
        return res.status(401).json({ success: false, error: 'Unauthorized: Invalid preview token.' });
      }
    }

    const type = req.query.type as string;
    if (!type) {
      return res.json({ success: true, templates: Object.keys(notificationCatalog) });
    }

    const meta = notificationCatalog[type];
    if (!meta) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    const html = renderBaseEmailLayout(
      {
        recipientName: 'Sarah Jenkins',
        workspaceName: 'Nest Realty Wilmington',
        headline: meta.headline,
        preheader: meta.subject,
        typeLabel: meta.typeLabel || 'Notification',
        summary: meta.summary,
        whyItMatters: meta.whyItMatters,
        recommendedAction: meta.recommendedAction,
        ctaLabel: meta.ctaLabel || 'Action Required',
        actionUrl: MOCK_ACTION_URL,
        priority: 'medium',
      },
      '🔔',
      dbState.branding
    );

    res.json({
      success: true,
      type,
      subject: meta.subject,
      html,
      text: meta.summary,
      smsBody: meta.smsBody
    });
  });

  // POST SEND TEST EMAIL
  router.post('/notification-previews/send-test', requireAuth, async (req, res) => {
    const { type, recipientEmail } = req.body;
    
    const enabled = process.env.ENABLE_NOTIFICATION_TEST_SEND === 'true';
    if (!enabled) {
      res.status(400).json({ success: false, error: 'Test sending is disabled by configuration.' });
      return;
    }

    const allowlistStr = process.env.NOTIFICATION_TEST_ALLOWLIST || 'marcus@shapework.co';
    const allowlist = allowlistStr.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
    if (!recipientEmail || !allowlist.includes(recipientEmail.trim().toLowerCase())) {
      res.status(400).json({ success: false, error: 'Recipient email is not in NOTIFICATION_TEST_ALLOWLIST.' });
      return;
    }

    const meta = notificationCatalog[type as string];
    if (!meta) {
      res.status(404).json({ success: false, error: 'Template not found' });
      return;
    }

    const html = renderBaseEmailLayout(
      {
        recipientName: 'Test Recipient',
        workspaceName: 'Nest Realty Wilmington',
        headline: meta.headline,
        preheader: meta.subject,
        typeLabel: meta.typeLabel || 'Notification',
        summary: meta.summary,
        whyItMatters: meta.whyItMatters,
        recommendedAction: meta.recommendedAction,
        ctaLabel: meta.ctaLabel || 'Action Required',
        actionUrl: MOCK_ACTION_URL,
        priority: 'medium',
      },
      '🔔',
      dbState.branding
    );

    import('../notifications/notificationProvider.js').then(async ({ ResendEmailProvider }) => {
      const provider = new ResendEmailProvider();
      const sendResult = await provider.sendEmail({
        to: recipientEmail.trim(),
        subject: `[Shapework Preview] ${meta.subject}`,
        html
      });

      if (sendResult.success) {
        console.log(`[Test Send] Test email successfully delivered to allowlisted address ${recipientEmail.trim()} (Msg ID: ${sendResult.messageId})`);
        res.json({ success: true, messageId: sendResult.messageId });
      } else {
        console.error(`[Test Send] Test email send failed: ${sendResult.error}`);
        res.status(500).json({ success: false, error: sendResult.error });
      }
    }).catch(err => {
      res.status(500).json({ success: false, error: err.message });
    });
  });

  // GET RESOLVE CLIENT PORTAL DETAILS
  router.get('/client-portal/resolve/:token', (req, res) => {
    const token = req.params.token;
    
    const isProduction = process.env.APP_MODE === 'production' || process.env.NODE_ENV === 'production';
    if (!isProduction && token === 'mock-client-deal-token') {
      return res.json({
        success: true,
        deal: {
          address: '109 Woodlawn Avenue, Wilmington, NC 28403',
          status: 'Compliance Audit',
          clientName: 'Sarah Jenkins',
          documents: [
            { id: 'd1', name: 'Escrow Wire Receipt', status: 'Approved' },
            { id: 'd2', name: 'Seller Disclosures Addendum', status: 'Pending Upload' }
          ],
          messages: [
            { sender: 'Brokerage Operations', text: 'Please upload the signed Seller Disclosures Addendum to proceed with escrow release.', date: 'Today, 10:15 AM' }
          ]
        }
      });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const portal = (dbState.clientPortals || []).find((p: any) => p.tokenHash === tokenHash);

    if (!portal || portal.status !== 'active') {
      return res.status(401).json({ success: false, error: 'Unauthorized: Link expired or invalid.' });
    }

    if (new Date(portal.expiresAt) < new Date()) {
      portal.status = 'expired';
      persistState();
      return res.status(401).json({ success: false, error: 'Unauthorized: Link expired.' });
    }

    const deal = {
      address: portal.dealId === 'd_109' ? '109 Woodlawn Avenue, Wilmington, NC 28403' : `Property ID: ${portal.dealId}`,
      status: 'Compliance Audit',
      clientName: portal.clientName,
      documents: [
        { id: 'd1', name: 'Escrow Wire Receipt', status: 'Approved' },
        { id: 'd2', name: 'Seller Disclosures Addendum', status: 'Pending Upload' }
      ],
      messages: [
        { sender: 'Brokerage Operations', text: 'Please upload the signed Seller Disclosures Addendum to proceed with escrow release.', date: 'Today, 10:15 AM' }
      ]
    };

    logHeadlessAudit(
      dbState,
      'External',
      'external_user',
      `Client portal accessed securely for deal ID: ${portal.dealId}`,
      'security'
    );

    res.json({ success: true, deal });
  });

  // GET RESOLVE AGENT PORTAL DETAILS
  router.get('/agent-portal/resolve/:token', (req, res) => {
    const token = req.params.token;

    const isProduction = process.env.APP_MODE === 'production' || process.env.NODE_ENV === 'production';
    if (!isProduction && token === 'mock-agent-action-token') {
      return res.json({
        success: true,
        action: {
          id: 'mock_action',
          title: 'MLS Listing Upload Verification',
          description: 'Please confirm that all compliance forms for 123 Oak Street are uploaded to MLS.',
          status: 'pending'
        }
      });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const portal = (dbState.agentPortals || []).find((p: any) => p.tokenHash === tokenHash);

    if (!portal || portal.status !== 'active') {
      return res.status(401).json({ success: false, error: 'Unauthorized: Link expired or invalid.' });
    }

    if (new Date(portal.expiresAt) < new Date()) {
      portal.status = 'expired';
      persistState();
      return res.status(401).json({ success: false, error: 'Unauthorized: Link expired.' });
    }

    const workItem = (dbState.workItems || []).find((wi: any) => wi.id === portal.actionId);
    if (!workItem) {
      return res.status(404).json({ success: false, error: 'Action task not found.' });
    }

    res.json({
      success: true,
      action: {
        id: workItem.id,
        title: workItem.title,
        description: workItem.description,
        status: workItem.status
      }
    });
  });

  return router;
}
