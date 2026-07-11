/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response } from 'express';
import * as crypto from 'crypto';
import { verifyApiNationDotloopWebhook } from './apinationDotloopVerifier';
import { normalizeDotloopPayload } from './apinationDotloopNormalizer';
import { requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission } from '../../auth/auth';
import { enqueueJob } from '../../jobs/jobQueue';
import { getWebhookIdempotencyKey, isDuplicateWebhook } from '../idempotency';

export type WebhookEndpointConfig = {
  id: string;
  workspaceId: string;
  provider: "apination_dotloop" | "rechat";
  endpointTokenHash: string;
  rawTokenForDisplay?: string; // stored in dev/scaffold for setup display
  secretHash?: string;
  rawSecretForDisplay?: string;
  status: "active" | "paused" | "revoked";
  createdAt: string;
  rotatedAt?: string;
  lastReceivedAt?: string;
};

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function getApiNationDotloopRouter(dbState: any): Router {
  const router = Router();

  // Helper to seed a default active webhook endpoint configuration if none exists
  function getOrSeedWebhookConfig(workspaceId: string): WebhookEndpointConfig {
    if (!dbState.webhookEndpoints) {
      dbState.webhookEndpoints = [];
    }

    let config = dbState.webhookEndpoints.find((w: any) => w.workspaceId === workspaceId && w.provider === 'apination_dotloop');
    
    if (!config) {
      const defaultToken = `tok_dotloop_${workspaceId}_${crypto.randomBytes(6).toString('hex')}`;
      const defaultSecret = `sec_dotloop_${workspaceId}_${crypto.randomBytes(8).toString('hex')}`;
      
      config = {
        id: `wh_cfg_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        workspaceId,
        provider: 'apination_dotloop',
        endpointTokenHash: hashToken(defaultToken),
        rawTokenForDisplay: defaultToken,
        secretHash: hashToken(defaultSecret),
        rawSecretForDisplay: defaultSecret,
        status: 'active',
        createdAt: new Date().toISOString()
      };
      
      dbState.webhookEndpoints.push(config);
      if (dbState.saveStateToStorage) dbState.saveStateToStorage();
    }
    
    return config;
  }

  // Helper to log server audit events
  function logServerAuditEvent(workspaceId: string, user: string, role: string, desc: string, category: string, impact = 'General') {
    const newAudit = {
      id: `audit_dotloop_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      workspaceId,
      timestamp: new Date().toISOString(),
      user_name: user,
      user_role: role,
      action_description: desc,
      impact_area: category,
      impact_property: impact,
      rollback_available: false
    };
    dbState.auditEvents = [newAudit, ...dbState.auditEvents];
    return newAudit;
  }

  /**
   * GET /api/integrations/apination/dotloop/status
   * Reports webhook configuration status for active workspace
   */
  router.get('/status', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('view_deals'), (req: Request, res: Response) => {
    const wsId = String(req.query.workspaceId || (req as any).workspace?.id || 'nest-realty-demo');
    const isEnabled = process.env.APINATION_DOTLOOP_WEBHOOK_ENABLED !== 'false';
    
    const config = getOrSeedWebhookConfig(wsId);
    const baseWebhookUrl = process.env.PUBLIC_WEBHOOK_BASE_URL || process.env.APP_BASE_URL || 'http://localhost:3000';
    const webhookUrl = `${baseWebhookUrl}/api/integrations/apination/dotloop/webhook/${config.rawTokenForDisplay || 'unconfigured'}`;

    const lastEvent = (dbState.integrationEvents || []).find(
      (e: any) => e.source === 'apination_dotloop' && (!e.workspaceId || e.workspaceId === wsId)
    );

    res.json({
      configured: config.status === 'active',
      enabled: isEnabled,
      webhookUrl,
      webhookSecret: config.rawSecretForDisplay || 'unconfigured',
      status: config.status,
      lastEventAt: lastEvent ? lastEvent.timestamp : null,
      eventsReceivedToday: (dbState.integrationEvents || []).filter((e: any) => {
        if (e.source !== 'apination_dotloop') return false;
        if (e.workspaceId && e.workspaceId !== wsId) return false;
        const eventDate = new Date(e.timestamp).toDateString();
        const todayDate = new Date().toDateString();
        return eventDate === todayDate;
      }).length,
      lastEventType: lastEvent ? lastEvent.eventType : null,
      lastError: null
    });
  });

  /**
   * POST /api/integrations/apination/dotloop/webhook/rotate-token
   * Rotates the opaque URL endpoint token. Admin only.
   */
  router.post('/webhook/rotate-token', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('manage_integrations'), (req, res) => {
    const wsId = String((req as any).workspace?.id || 'nest-realty-demo');
    const config = getOrSeedWebhookConfig(wsId);

    const newToken = `tok_dotloop_${wsId}_${crypto.randomBytes(6).toString('hex')}`;
    config.endpointTokenHash = hashToken(newToken);
    config.rawTokenForDisplay = newToken;
    config.rotatedAt = new Date().toISOString();

    logServerAuditEvent(
      wsId,
      'System Administrator',
      'Administrator',
      'Rotated Dotloop API Nation webhook opaque endpoint token.',
      'Integrations',
      'Dotloop'
    );

    if (dbState.saveStateToStorage) dbState.saveStateToStorage();

    res.json({ success: true, token: newToken });
  });

  /**
   * POST /api/integrations/apination/dotloop/webhook/rotate-secret
   * Rotates the webhook verification header secret. Admin only.
   */
  router.post('/webhook/rotate-secret', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('manage_integrations'), (req, res) => {
    const wsId = String((req as any).workspace?.id || 'nest-realty-demo');
    const config = getOrSeedWebhookConfig(wsId);

    const newSecret = `sec_dotloop_${wsId}_${crypto.randomBytes(8).toString('hex')}`;
    config.secretHash = hashToken(newSecret);
    config.rawSecretForDisplay = newSecret;
    config.rotatedAt = new Date().toISOString();

    logServerAuditEvent(
      wsId,
      'System Administrator',
      'Administrator',
      'Rotated Dotloop API Nation webhook signature verification secret.',
      'Integrations',
      'Dotloop'
    );

    if (dbState.saveStateToStorage) dbState.saveStateToStorage();

    res.json({ success: true, secret: newSecret });
  });

  /**
   * POST /api/integrations/apination/dotloop/webhook/revoke
   * Revokes/pauses the active webhook configuration. Admin only.
   */
  router.post('/webhook/revoke', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('manage_integrations'), (req, res) => {
    const wsId = String((req as any).workspace?.id || 'nest-realty-demo');
    const config = getOrSeedWebhookConfig(wsId);

    config.status = 'revoked';

    logServerAuditEvent(
      wsId,
      'System Administrator',
      'Administrator',
      'Revoked and deactivated Dotloop webhook endpoint.',
      'Integrations',
      'Dotloop'
    );

    if (dbState.saveStateToStorage) dbState.saveStateToStorage();

    res.json({ success: true, status: 'revoked' });
  });

  // Shared processor for webhooks
  const handleDotloopWebhook = (req: Request, res: Response, workspaceId: string) => {
    const rawPayload = req.body;
    
    // 1. Verify Request Signature
    const verification = verifyApiNationDotloopWebhook(req);

    // Setup initial receipt
    const receiptId = `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const receivedAt = new Date().toISOString();
    
    let loopName = 'Unknown Loop';
    let eventType = rawPayload.type || rawPayload.eventType || 'loop_updated';
    
    if (rawPayload.loop) {
      loopName = rawPayload.loop.name || loopName;
    }

    const receipt: any = {
      id: receiptId,
      workspaceId,
      source: 'apination_dotloop',
      channel: rawPayload.channel || 'Unknown Channel',
      receivedAt,
      verificationStatus: verification.valid ? 'verified' : 'failed',
      normalizationStatus: 'pending',
      matchStatus: 'unmatched',
      errorMessage: verification.reason || undefined,
      loopName,
      eventType,
      redactedPayload: { loopId: rawPayload.loop?.id || 'N/A' } // Redact PII in receipt
    };

    if (!(dbState as any).integrationReceipts) (dbState as any).integrationReceipts = [];
    (dbState as any).integrationReceipts.unshift(receipt);

    if (!verification.valid) {
      console.warn(`[API Nation Dotloop Webhook] Verification failed: ${verification.reason}`);
      return res.status(401).json({ error: 'Unauthorized', reason: verification.reason });
    }

    // 2. Generate and verify idempotency key
    const idempotencyKey = getWebhookIdempotencyKey('apination_dotloop', workspaceId, rawPayload);
    const duplicate = isDuplicateWebhook(idempotencyKey, dbState);
    
    if (duplicate) {
      console.log(`[API Nation Dotloop Webhook] Duplicate webhook ignored for key ${idempotencyKey}`);
      
      // Log ignore event
      logServerAuditEvent(
        workspaceId,
        'API Nation Webhook Gateway',
        'system',
        `Duplicate webhook ignored. Idempotency key: ${idempotencyKey.substring(0, 12)}...`,
        'Integrations',
        loopName
      );
      
      return res.status(200).json({ success: true, message: 'Duplicate webhook ignored.' });
    }

    // 3. Queue processing job
    const job = enqueueJob(workspaceId, 'dotloop_webhook_process', { eventPayload: rawPayload }, { idempotencyKey });

    res.status(202).json({
      success: true,
      message: 'Webhook received and queued for processing.',
      jobId: job.id
    });
  };

  /**
   * POST /api/integrations/apination/dotloop/webhook/:webhookToken
   * Opaque tokenized webhook endpoint. Prevents guessing and enforces routing.
   */
  router.post('/webhook/:webhookToken', (req: Request, res: Response) => {
    const { webhookToken } = req.params;
    const tokenHash = hashToken(webhookToken);

    // Look up workspaceId by hash matching
    const config = (dbState.webhookEndpoints || []).find((w: any) => w.endpointTokenHash === tokenHash);
    
    if (!config) {
      console.warn(`[API Nation Dotloop Webhook] Rejected unmapped endpoint token: ${webhookToken}`);
      return res.status(404).json({ error: 'Not Found', message: 'Webhook endpoint token is not mapped.' });
    }

    if (config.status !== 'active') {
      console.warn(`[API Nation Dotloop Webhook] Rejected inactive endpoint token mapping. Status: ${config.status}`);
      return res.status(403).json({ error: 'Forbidden', message: 'Webhook endpoint configuration is inactive.' });
    }

    // Update statistics
    config.lastReceivedAt = new Date().toISOString();

    // Delegate processing to mapped workspace ID context
    handleDotloopWebhook(req, res, config.workspaceId);
  });

  return router;
}
