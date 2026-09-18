/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Contract Channel Routes — Phase 4A.2 Security Hardening
 * Express router for multi-channel intake (SMS, Retell phone, email) with cryptographic signature verification
 * and authenticated broker claim endpoint.
 */

import { Router, Request, Response } from 'express';
import { RetellContractIntakeAdapter } from './retellContractIntakeAdapter.js';
import { EmailContractIntakeAdapter } from './emailContractIntakeAdapter.js';
import { PendingContractIntakeService } from './pendingContractIntake.js';

export const contractChannelRouter = Router();

// 1. POST /api/contracts/channels/sms (Inbound Retell SMS Intake)
contractChannelRouter.post('/sms', async (req: Request, res: Response) => {
  try {
    const { workspaceId = 'nest-realty-wilmington', fromPhone, text, externalMessageId, idempotencyKey, apiKey } = req.body || {};
    const signatureHeader = (req.headers['x-retell-signature'] as string) || req.body?.signatureHeader;
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    if (!fromPhone || !text) {
      return res.status(400).json({ success: false, error: 'MISSING_REQUIRED_SMS_FIELDS: fromPhone and text are required.' });
    }

    const result = await RetellContractIntakeAdapter.processIntake({
      workspaceId,
      fromPhone,
      channel: 'retell_sms',
      text,
      rawBody,
      signatureHeader,
      apiKey,
      externalMessageId,
      idempotencyKey
    });

    return res.json(result);
  } catch (err: any) {
    const isAuth = err.message.includes('UNVERIFIED_BROKER') || err.message.includes('TRANSPORT_VERIFICATION_FAILED');
    return res.status(isAuth ? 403 : 400).json({ success: false, error: err.message });
  }
});

// 2. POST /api/contracts/channels/phone (Inbound Retell Phone Call Intake)
contractChannelRouter.post('/phone', async (req: Request, res: Response) => {
  try {
    const { workspaceId = 'nest-realty-wilmington', fromPhone, text, externalConversationId, idempotencyKey, apiKey } = req.body || {};
    const signatureHeader = (req.headers['x-retell-signature'] as string) || req.body?.signatureHeader;
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    if (!fromPhone || !text) {
      return res.status(400).json({ success: false, error: 'MISSING_REQUIRED_PHONE_FIELDS: fromPhone and text are required.' });
    }

    const result = await RetellContractIntakeAdapter.processIntake({
      workspaceId,
      fromPhone,
      channel: 'retell_phone',
      text,
      rawBody,
      signatureHeader,
      apiKey,
      externalConversationId,
      idempotencyKey
    });

    return res.json(result);
  } catch (err: any) {
    const isAuth = err.message.includes('UNVERIFIED_BROKER') || err.message.includes('TRANSPORT_VERIFICATION_FAILED');
    return res.status(isAuth ? 403 : 400).json({ success: false, error: err.message });
  }
});

// 3. POST /api/contracts/channels/email (Inbound Email Contract Intake)
contractChannelRouter.post('/email', async (req: Request, res: Response) => {
  try {
    const { workspaceId = 'nest-realty-wilmington', fromEmail, subject = '', body = '', externalMessageId, idempotencyKey, signingSecret } = req.body || {};
    const signatureHeader = (req.headers['x-email-signature'] as string) || req.body?.signatureHeader;
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    if (!fromEmail) {
      return res.status(400).json({ success: false, error: 'MISSING_REQUIRED_EMAIL_FIELDS: fromEmail is required.' });
    }

    const result = await EmailContractIntakeAdapter.processIntake({
      workspaceId,
      fromEmail,
      subject,
      body,
      rawBody,
      signatureHeader,
      signingSecret,
      externalMessageId,
      idempotencyKey
    });

    return res.json(result);
  } catch (err: any) {
    const isAuth = err.message.includes('UNVERIFIED_BROKER') || err.message.includes('TRANSPORT_VERIFICATION_FAILED') || err.message.includes('EMAIL_VERIFIER_NOT_CONFIGURED');
    return res.status(isAuth ? 403 : 400).json({ success: false, error: err.message });
  }
});

// 4. POST /api/contracts/channels/pending/:id/claim (Authenticated Broker Claim Endpoint)
contractChannelRouter.post('/pending/:id/claim', async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).authUser;
    const workspaceId = (req as any).workspaceId || req.body.workspaceId || 'nest-realty-wilmington';
    const requestingUserId = authUser?.id || req.body.requestingUserId;
    const actorCapability = req.body.actorCapability || 'contract_authoring';

    if (!requestingUserId) {
      return res.status(401).json({ success: false, error: 'UNAUTHENTICATED_BROKER_CLAIM: Authentication required to claim pending contract intake.' });
    }

    const session = await PendingContractIntakeService.claimPendingIntake({
      pendingIntakeId: req.params.id,
      workspaceId,
      requestingUserId,
      actorCapability
    });

    return res.json({ success: true, session });
  } catch (err: any) {
    const isForbidden = err.message.includes('CROSS_WORKSPACE') || err.message.includes('UNAUTHORIZED_CLAIM') || err.message.includes('FORBIDDEN');
    return res.status(isForbidden ? 403 : 400).json({ success: false, error: err.message });
  }
});
