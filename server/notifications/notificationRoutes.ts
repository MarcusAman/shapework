import express from 'express';
import { validateSecureActionToken, useSecureActionToken } from './notificationToken.js';
import { triggerNotification } from './notificationRules.js';
import { logNotificationAudit } from './notificationTypes.js';
import { verifyJwt } from '../auth/jwt.js';
import { requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission } from '../auth/auth.js';
import { csrfProtection } from '../auth/csrf.js';
import { compileEmailNotification } from './notificationRenderer.js';
import { triggerDigestSms } from './actionDigests.js';

export function getNotificationRouter(dbState: any, persistState: () => void) {
  const router = express.Router();

  // GET COOLDOWN AND EVENT RULES
  router.get('/settings', (req, res) => {
    res.json({
      success: true,
      cooldown: dbState.settings?.notificationCooldownMinutes || 5,
      rules: dbState.notificationRules || {
        on_proposal_created: true,
        on_proposal_approved: true,
        on_proposal_rejected: true,
        on_work_item_created: true,
        on_work_item_completed: true,
        on_work_item_nudge: true,
        on_owner_brief_compiled: true
      },
      auditLog: dbState.auditEvents?.filter((e: any) => e.impact_area === 'notifications') || []
    });
  });

  // UPDATE COOLDOWN AND EVENT RULES
  router.post('/settings/update', (req, res) => {
    const { cooldown, rules } = req.body;
    if (!dbState.settings) dbState.settings = {};
    if (cooldown !== undefined) {
      dbState.settings.notificationCooldownMinutes = Number(cooldown);
    }
    if (rules !== undefined) {
      dbState.notificationRules = rules;
    }
    persistState();
    logNotificationAudit(dbState, 'System', 'system', 'Updated notification settings', 'notifications');
    res.json({ success: true });
  });

  // MANUAL NOTIFICATION TRIGGER (mainly for testing/E2E purposes)
  router.post('/trigger', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('manage_integrations'), csrfProtection, async (req, res) => {
    const { recipientId, actionType, workItemId, approvalId, contextText } = req.body;
    const wsId = req.headers['x-workspace-id'] as string || 'nest-realty-demo';
    
    // Log token/notification creation audit
    logNotificationAudit(
      dbState,
      'System',
      'system',
      `Queuing notification for ${recipientId} (${actionType})`,
      'notifications'
    );
    
    const notif = await triggerNotification(dbState, wsId, recipientId, actionType, {
      workItemId,
      approvalId,
      contextText
    });
    
    persistState();
    
    if (notif) {
      res.json({ success: true, notification: notif, token: (notif as any).rawToken });
    } else {
      res.status(400).json({ success: false, error: 'Notification supressed by cooldown or recipient is inactive.' });
    }
  });

  // POST TRIGGER ACTION DIGEST
  router.post('/digest/trigger', async (req, res) => {
    const { to, type, counts, actionUrl } = req.body;
    if (!to || !type || !counts || !actionUrl) {
      res.status(400).json({ success: false, error: 'to, type, counts, and actionUrl are required.' });
      return;
    }

    const result = await triggerDigestSms(dbState, to, type, counts, actionUrl);
    persistState();
    res.json({ success: result.success, message: result.message });
  });

  // GET SECURE ACTION FOR A TOKEN
  router.get('/action/:token', (req, res) => {
    const token = req.params.token;
    
    // Validate token
    const secureToken = validateSecureActionToken(dbState, token);
    if (!secureToken) {
      res.status(404).json({ success: false, error: 'Link expired or invalid.' });
      return;
    }
    
    // Log click event
    logNotificationAudit(
      dbState,
      'External',
      'external_user',
      `secure_action_page_opened: Action Type ${secureToken.actionType}, Token Hash ${secureToken.tokenHash.substring(0, 8)}`,
      'notifications'
    );
    
    // Fetch associated work item if exists
    let workItem = null;
    if (secureToken.workItemId) {
      workItem = (dbState.workItems || []).find((w: any) => w.id === secureToken.workItemId);
    }
    
    // Fetch associated approval if exists
    let approval = null;
    if (secureToken.approvalId) {
      approval = (dbState.decisions || []).find((d: any) => d.id === secureToken.approvalId) ||
                 (dbState.actionProposals || []).find((p: any) => p.id === secureToken.approvalId);
    }
    
    res.json({
      success: true,
      actionType: secureToken.actionType,
      expiresAt: secureToken.expiresAt,
      workItem,
      approval,
      recipientId: secureToken.recipientStaffMemberId
    });
  });

  // COMPLETE SECURE ACTION
  router.post('/action/:token/complete', (req, res) => {
    const token = req.params.token;
    const { actionResult, notes } = req.body; // e.g. 'approve', 'reject', 'completed'
    
    const secureToken = validateSecureActionToken(dbState, token);
    if (!secureToken) {
      res.status(404).json({ success: false, error: 'Link expired or invalid.' });
      return;
    }

    // Check if the action is classified as sensitive
    const isSensitive = [
      'approve_action', 'approve_proposal', 'send_sms', 'send_compliance_nudge',
      'post_to_teams', 'create_calendar_event', 'update_calendar_event',
      'change_assignment', 'view_private_documents', 'view_financial_details',
      'disconnect_integrations', 'change_notification_rules', 'change_workspace_settings'
    ].includes(secureToken.actionType);

    if (isSensitive) {
      // Validate that session cookie or auth header represents a valid user session
      let sessionToken = '';
      const cookieHeader = req.headers.cookie;
      if (cookieHeader) {
        const match = cookieHeader.match(/shapework_session=([^;]+)/);
        if (match) sessionToken = match[1];
      }
      const authHeader = req.headers['authorization'];
      if (!sessionToken && authHeader && authHeader.startsWith('Bearer ')) {
        sessionToken = authHeader.split(' ')[1];
      }

      const APP_MODE = process.env.APP_MODE || 'development';
      let isValidSession = false;

      if (sessionToken) {
        const payload = verifyJwt(sessionToken);
        if (payload && payload.userId) {
          isValidSession = true;
        } else if (APP_MODE !== 'production' && (sessionToken.startsWith('token_usr_') || sessionToken.includes('@'))) {
          isValidSession = true;
        }
      }

      if (!isValidSession) {
        logNotificationAudit(
          dbState,
          'External',
          'external_user',
          `Blocked sensitive action "${secureToken.actionType}" via token due to missing session context`,
          'security'
        );
        res.status(401).json({ success: false, error: 'Sensitive actions require step-up authentication. Please log in.' });
        return;
      }
    }

    // Mark token as used
    useSecureActionToken(dbState, token);
    
    // Log audit event for token usage
    logNotificationAudit(
      dbState,
      'External',
      'external_user',
      `secure_action_page_action_completed: Resolved "${secureToken.actionType}" via secure action link`,
      'security'
    );

    // If there is an associated work item, update its status
    if (secureToken.workItemId) {
      const workItem = (dbState.workItems || []).find((w: any) => w.id === secureToken.workItemId);
      if (workItem) {
        workItem.status = 'completed';
        workItem.updatedAt = new Date().toISOString();
        logNotificationAudit(
          dbState,
          'External',
          'external_user',
          `Completed work item "${workItem.title}" via secure action link. Notes: ${notes || ''}`,
          'notifications'
        );
      }
    }

    // If there is an associated approval, update its status
    if (secureToken.approvalId) {
      const approval = (dbState.decisions || []).find((d: any) => d.id === secureToken.approvalId) ||
                       (dbState.actionProposals || []).find((p: any) => p.id === secureToken.approvalId);
      if (approval) {
        approval.status = actionResult === 'reject' ? 'rejected' : 'approved';
        approval.updatedAt = new Date().toISOString();
        logNotificationAudit(
          dbState,
          'External',
          'external_user',
          `Resolved approval "${approval.title}" to ${approval.status} via secure action link. Notes: ${notes || ''}`,
          'notifications'
        );
      }
    }

    persistState();
    res.json({ success: true });
  });

  // LIST DISPATCHED NOTIFICATIONS
  router.get('/list', (req, res) => {
    const masked = (dbState.notifications || []).map((n: any) => {
      const email = n.recipientEmail || '';
      let maskedEmail = '';
      if (email.includes('@')) {
        const [local, domain] = email.split('@');
        maskedEmail = local.charAt(0) + '*'.repeat(Math.max(1, local.length - 2)) + local.slice(-1) + '@' + domain;
      }
      
      const phone = n.recipientPhone || '';
      let maskedPhone = '';
      if (phone) {
        const clean = phone.replace(/\D/g, '');
        if (clean.length >= 10) {
          maskedPhone = `${clean.slice(0, 3)}-***-**${clean.slice(-2)}`;
        } else {
          maskedPhone = '***-***-****';
        }
      }
      
      // Make sure raw tokens or details are never returned
      const { rawToken, secureActionTokenHash, ...rest } = n;
      return {
        ...rest,
        recipientEmail: maskedEmail || undefined,
        recipientPhone: maskedPhone || undefined
      };
    });

    res.json({
      success: true,
      notifications: masked
    });
  });

  return router;
}

export function registerDevPreviewRoute(app: any, dbState: any) {
  app.get('/dev/notifications/email-preview/:template', (req: any, res: any) => {
    const APP_MODE = process.env.APP_MODE || 'development';
    if (APP_MODE === 'production') {
      res.status(404).send('Not Found');
      return;
    }

    const template = req.params.template as any;
    const allowed = [
      'work_item_assigned', 'approval_needed', 'missing_info_needed',
      'due_soon', 'overdue', 'owner_brief_ready', 'task_completed', 'integration_issue'
    ];
    if (!allowed.includes(template)) {
      res.status(404).send(`Invalid template. Allowed: ${allowed.join(', ')}`);
      return;
    }

    const PORT = process.env.PORT || '3063';
    const domain = process.env.APP_URL || `http://localhost:${PORT}`;
    const actionUrl = `${domain}/action/mock_preview_token`;

    // Populate mock details
    const mockInput: any = {
      recipientName: 'Sarah Jenkins',
      workspaceName: 'Nest Realty Demo',
      actionUrl,
      summary: 'This is a sample operational summary generated for previewing email layout styling.',
      whyItMatters: 'Failure to resolve this block will delay transaction close and trigger compliance escrow holds.',
      recommendedAction: 'Verify the document contents and approve the dispatch.',
      assignedTo: 'Brokerage Operations',
      dueText: 'Immediate',
      priority: 'high'
    };

    if (template === 'approval_needed') {
      mockInput.actionTitle = 'Tax transcript request';
      mockInput.priority = 'owner_worthy';
    } else if (template === 'work_item_assigned') {
      mockInput.workItemTitle = 'Review earnest wire deposit';
    } else if (template === 'missing_info_needed') {
      mockInput.workItemTitle = 'Missing listing photography';
      mockInput.priority = 'medium';
    } else if (template === 'due_soon') {
      mockInput.workItemTitle = 'Utility transfer verification';
      mockInput.dueText = '24 hours';
      mockInput.priority = 'medium';
    } else if (template === 'overdue') {
      mockInput.workItemTitle = 'Title commitment review';
      mockInput.dueText = 'Overdue';
    } else if (template === 'owner_brief_ready') {
      mockInput.priority = undefined;
    } else if (template === 'task_completed') {
      mockInput.workItemTitle = 'Office lease renewal';
      mockInput.dueText = 'Completed';
      mockInput.priority = 'low';
    } else if (template === 'integration_issue') {
      mockInput.integrationName = 'Zillow Sync';
      mockInput.priority = 'high';
    }

    const { html } = compileEmailNotification(template, mockInput);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  });
}
