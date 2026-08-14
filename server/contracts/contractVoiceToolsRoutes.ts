/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Contract Voice Tools Express Router — Phase 3 Architecture
 * Endpoints consumed by ElevenLabs conversational tools, protected by verified VoiceAuthorizationTokens.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { ContractVoiceTokenService, VoiceAuthorizationTokenPayload } from './contractVoiceToken.js';
import { ContractService } from './contractService.js';
import { ContractValidationEngine } from './contractValidationSchemas.js';

export const contractVoiceToolsRouter = Router();

/**
 * Middleware: Verify and extract voice authorization token payload.
 */
function requireVoiceToken(req: Request, res: Response, next: NextFunction) {
  try {
    const tokenHeader = (req.headers['x-voice-token'] as string) || req.body?.voiceToken || (req.query?.voiceToken as string);
    if (!tokenHeader) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED_VOICE_TOKEN_MISSING', message: 'Voice authorization token is required.' });
    }

    // Decode and verify token
    const payload = ContractVoiceTokenService.verifyVoiceToken(tokenHeader);
    (req as any).voicePayload = payload;
    next();
  } catch (err: any) {
    return res.status(401).json({
      success: false,
      error: err.message.split(':')[0] || 'UNAUTHORIZED_VOICE_TOKEN_INVALID',
      message: err.message
    });
  }
}

function getVerifiedVoicePayload(req: Request): VoiceAuthorizationTokenPayload {
  return (req as any).voicePayload;
}

contractVoiceToolsRouter.use(requireVoiceToken);

// 1. POST /api/contracts/voice-tools/get_contract_intake
contractVoiceToolsRouter.post('/get_contract_intake', async (req: Request, res: Response) => {
  try {
    const payload = getVerifiedVoicePayload(req);
    const session = await ContractService.getSession(payload.sessionId, payload.workspaceId);

    if (!session) {
      return res.status(404).json({ success: false, error: 'Contract intake session not found.' });
    }

    const { isValid, isBlocked, bicReviewRequired, issues } = ContractValidationEngine.validateSession(session);

    return res.json({
      success: true,
      sessionId: session.id,
      status: session.status,
      transactionType: session.transactionType,
      property: session.property,
      buyers: session.parties.filter(p => p.role === 'buyer').map(p => ({ fullName: p.fullName, email: p.email })),
      terms: session.terms,
      selectedForms: session.selectedForms.map(f => f.displayName),
      isValid,
      isBlocked,
      bicReviewRequired,
      validationIssues: issues.map(i => ({ code: i.code, message: i.message, severity: i.severity }))
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 2. POST /api/contracts/voice-tools/update_contract_terms
contractVoiceToolsRouter.post('/update_contract_terms', async (req: Request, res: Response) => {
  try {
    const payload = getVerifiedVoicePayload(req);
    const { terms = {} } = req.body || {};

    const sourceRef = {
      fieldPath: 'terms',
      sourceType: 'manual_entry' as const,
      sourceTimestamp: new Date().toISOString(),
      suppliedByUserId: payload.userId,
      verificationStatus: 'verified' as const,
      conflictStatus: 'no_conflict' as const,
      factualNotes: 'Captured via ElevenLabs WebRTC Voice Session'
    };

    const session = await ContractService.updateTerms(
      payload.sessionId,
      payload.workspaceId,
      terms,
      [sourceRef],
      payload.userId,
      payload.capability
    );

    return res.json({
      success: true,
      status: session.status,
      updatedTerms: session.terms,
      validationIssues: session.validationIssues
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// 3. POST /api/contracts/voice-tools/add_transaction_party
contractVoiceToolsRouter.post('/add_transaction_party', async (req: Request, res: Response) => {
  try {
    const payload = getVerifiedVoicePayload(req);
    const { fullName, role = 'buyer', email, phone } = req.body || {};

    if (!fullName || typeof fullName !== 'string') {
      return res.status(400).json({ success: false, error: 'Full name is required for transaction party.' });
    }

    const session = await ContractService.getSession(payload.sessionId, payload.workspaceId);
    if (!session) return res.status(404).json({ success: false, error: 'Contract intake session not found.' });

    const newParty = {
      id: `party_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      role: role as any,
      fullName: fullName.trim(),
      email,
      phone
    };

    session.parties.push(newParty);
    session.updatedAt = new Date().toISOString();

    const updated = await ContractService.updateTerms(payload.sessionId, payload.workspaceId, {}, [], payload.userId, payload.capability);
    return res.json({ success: true, parties: updated.parties });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// 4. POST /api/contracts/voice-tools/update_property
contractVoiceToolsRouter.post('/update_property', async (req: Request, res: Response) => {
  try {
    const payload = getVerifiedVoicePayload(req);
    const { streetAddress, city, county = 'New Hanover', state = 'NC', postalCode = '28401', mlsId } = req.body || {};

    const session = await ContractService.getSession(payload.sessionId, payload.workspaceId);
    if (!session) return res.status(404).json({ success: false, error: 'Contract intake session not found.' });

    session.property = {
      streetAddress: streetAddress || session.property?.streetAddress || '',
      city: city || session.property?.city || 'Wilmington',
      county: county || session.property?.county || 'New Hanover',
      state: 'NC',
      postalCode: postalCode || session.property?.postalCode || '28401',
      mlsId: mlsId || session.property?.mlsId
    };

    const updated = await ContractService.updateTerms(payload.sessionId, payload.workspaceId, {}, [], payload.userId, payload.capability);
    return res.json({ success: true, property: updated.property });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// 5. POST /api/contracts/voice-tools/confirm_contract_terms
contractVoiceToolsRouter.post('/confirm_contract_terms', async (req: Request, res: Response) => {
  try {
    const payload = getVerifiedVoicePayload(req);
    const { explicitBrokerConfirmation } = req.body || {};

    if (!explicitBrokerConfirmation) {
      return res.status(400).json({
        success: false,
        error: 'EXPLICIT_CONFIRMATION_REQUIRED',
        message: 'Broker must explicitly confirm terms following critical-term readback.'
      });
    }

    const session = await ContractService.confirmTerms(payload.sessionId, payload.workspaceId, payload.userId, payload.capability);
    return res.json({ success: true, status: session.status });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// 6. POST /api/contracts/voice-tools/request_bic_review
contractVoiceToolsRouter.post('/request_bic_review', async (req: Request, res: Response) => {
  try {
    const payload = getVerifiedVoicePayload(req);
    const { reason = 'BIC review requested during voice session.' } = req.body || {};

    const session = await ContractService.requestBicReview(payload.sessionId, payload.workspaceId, reason, payload.userId, payload.capability);
    return res.json({ success: true, status: session.status, bicReviewReason: session.bicReviewReason });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// 7. POST /api/contracts/voice-tools/request_mock_draft
contractVoiceToolsRouter.post('/request_mock_draft', async (req: Request, res: Response) => {
  try {
    const payload = getVerifiedVoicePayload(req);
    const session = await ContractService.requestDraft(payload.sessionId, payload.workspaceId, payload.userId, payload.capability);

    return res.json({
      success: true,
      status: session.status,
      draftManifest: session.draftManifest
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});
