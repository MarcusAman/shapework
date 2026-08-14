/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Contract Express Router — Phase 2.1 Hardened Architecture
 * Mounts authenticated, workspace-isolated contract intake REST API endpoints with explicit capability authorization.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { ContractService } from './contractService.js';
import { defaultContractRepository, ProductionSafetyGate } from './contractRepository.js';
import { ContractVoiceTokenService } from './contractVoiceToken.js';

export const contractRouter = Router();

/**
 * Middleware: Enforce Production Safety Gate.
 */
function enforceProductionSafetyGate(req: Request, res: Response, next: NextFunction) {
  try {
    ProductionSafetyGate.assertProductionSafety();
    next();
  } catch (err: any) {
    return res.status(503).json({
      success: false,
      error: 'CONTRACT_COPILOT_DISABLED_NO_DURABLE_STORAGE',
      message: err.message
    });
  }
}

/**
 * Helper to check user permissions or role capabilities.
 */
function getUserPermissions(req: Request): string[] {
  const user = (req as any).user || (req as any).authUser || {};
  const membership = (req as any).membership || {};
  
  const userPerms: string[] = user.permissions || [];
  const memberPerms: string[] = membership.permissions || [];
  
  return [...new Set([...userPerms, ...memberPerms])];
}

/**
 * Middleware: Verify user has contract_authoring capability.
 */
function requireContractCapability(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user || (req as any).authUser;
  if (!user) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  const permissions = getUserPermissions(req);
  const role = (user.role || '').toLowerCase();

  const isAuthorizedRole = ['admin', 'operations_lead', 'bic', 'broker_in_charge', 'managing_director', 'broker', 'licensed_broker', 'agent', 'owner'].includes(role);
  const hasCapability = permissions.includes('contract_authoring') || isAuthorizedRole;

  if (!hasCapability) {
    return res.status(403).json({
      success: false,
      error: 'FORBIDDEN_CONTRACT_AUTHORING_REQUIRED',
      message: 'Forbidden: User lacks contract_authoring capability.'
    });
  }

  next();
}

/**
 * Middleware: Verify user has explicit contract_bic_review capability.
 */
function requireBicCapability(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user || (req as any).authUser;
  if (!user) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  const permissions = getUserPermissions(req);
  const role = (user.role || '').toLowerCase();

  // Explicit capability requirement: contract_bic_review or explicit bic role assignment
  const hasBicCapability = permissions.includes('contract_bic_review') || ['bic', 'broker_in_charge', 'compliance_partner'].includes(role);

  if (!hasBicCapability) {
    return res.status(403).json({
      success: false,
      error: 'FORBIDDEN_BIC_CAPABILITY_REQUIRED',
      message: 'Forbidden: Explicit contract_bic_review capability required to perform BIC review actions.'
    });
  }

  next();
}

function getWorkspaceId(req: Request): string {
  return (req as any).workspaceId || (req as any).workspace?.id || 'nest-realty-wilmington';
}

function getActorUserId(req: Request): string {
  return (req as any).user?.id || (req as any).authUser?.id || 'usr_broker';
}

function getActorCapability(req: Request): string {
  const permissions = getUserPermissions(req);
  if (permissions.includes('contract_bic_review')) return 'contract_bic_review';
  return 'contract_authoring';
}

// Apply Production Safety Gate to all contract endpoints
contractRouter.use(enforceProductionSafetyGate);

// 1. POST /api/contracts/intake-sessions
contractRouter.post('/intake-sessions', requireContractCapability, async (req: Request, res: Response) => {
  try {
    const workspaceId = getWorkspaceId(req);
    const requestingUserId = getActorUserId(req);
    const actorCapability = getActorCapability(req);

    const {
      requestingBrokerId = requestingUserId,
      officeId,
      opsRequestId,
      channel,
      transactionType,
      idempotencyKey,
      parties,
      property
    } = req.body || {};

    const session = await ContractService.createSession({
      workspaceId,
      requestingUserId,
      requestingBrokerId,
      officeId,
      opsRequestId,
      channel,
      transactionType,
      idempotencyKey,
      parties,
      property,
      actorCapability
    });

    return res.status(201).json({ success: true, session });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// 2. GET /api/contracts/intake-sessions/:sessionId
contractRouter.get('/intake-sessions/:sessionId', requireContractCapability, async (req: Request, res: Response) => {
  try {
    const workspaceId = getWorkspaceId(req);
    const { sessionId } = req.params;

    const session = await ContractService.getSession(sessionId, workspaceId);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Contract intake session not found.' });
    }

    return res.json({ success: true, session });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 3. PATCH /api/contracts/intake-sessions/:sessionId/terms
contractRouter.patch('/intake-sessions/:sessionId/terms', requireContractCapability, async (req: Request, res: Response) => {
  try {
    const workspaceId = getWorkspaceId(req);
    const actorUserId = getActorUserId(req);
    const actorCapability = getActorCapability(req);
    const { sessionId } = req.params;
    const { terms = {}, sources = [] } = req.body || {};

    const session = await ContractService.updateTerms(
      sessionId,
      workspaceId,
      terms,
      sources,
      actorUserId,
      actorCapability
    );

    return res.json({ success: true, session });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// 4. POST /api/contracts/intake-sessions/:sessionId/confirm-terms
contractRouter.post('/intake-sessions/:sessionId/confirm-terms', requireContractCapability, async (req: Request, res: Response) => {
  try {
    const workspaceId = getWorkspaceId(req);
    const actorUserId = getActorUserId(req);
    const actorCapability = getActorCapability(req);
    const { sessionId } = req.params;

    const session = await ContractService.confirmTerms(sessionId, workspaceId, actorUserId, actorCapability);
    return res.json({ success: true, session });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// 5. POST /api/contracts/intake-sessions/:sessionId/select-forms
contractRouter.post('/intake-sessions/:sessionId/select-forms', requireContractCapability, async (req: Request, res: Response) => {
  try {
    const workspaceId = getWorkspaceId(req);
    const actorUserId = getActorUserId(req);
    const actorCapability = getActorCapability(req);
    const { sessionId } = req.params;
    const { forms = [] } = req.body || {};

    const session = await ContractService.selectForms(sessionId, workspaceId, forms, actorUserId, actorCapability);
    return res.json({ success: true, session });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// 6. POST /api/contracts/intake-sessions/:sessionId/validate
contractRouter.post('/intake-sessions/:sessionId/validate', requireContractCapability, async (req: Request, res: Response) => {
  try {
    const workspaceId = getWorkspaceId(req);
    const actorUserId = getActorUserId(req);
    const actorCapability = getActorCapability(req);
    const { sessionId } = req.params;

    const session = await ContractService.validateSession(sessionId, workspaceId, actorUserId, actorCapability);
    return res.json({ success: true, session });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// 7. POST /api/contracts/intake-sessions/:sessionId/request-bic-review
contractRouter.post('/intake-sessions/:sessionId/request-bic-review', requireContractCapability, async (req: Request, res: Response) => {
  try {
    const workspaceId = getWorkspaceId(req);
    const actorUserId = getActorUserId(req);
    const actorCapability = getActorCapability(req);
    const { sessionId } = req.params;
    const { reason = 'Manual BIC escalation requested.' } = req.body || {};

    const session = await ContractService.requestBicReview(sessionId, workspaceId, reason, actorUserId, actorCapability);
    return res.json({ success: true, session });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// 8. POST /api/contracts/intake-sessions/:sessionId/request-draft (Resolves BIC Review if in bic_review_required)
contractRouter.post('/intake-sessions/:sessionId/request-draft', requireContractCapability, async (req: Request, res: Response) => {
  try {
    const workspaceId = getWorkspaceId(req);
    const actorUserId = getActorUserId(req);

    // Check if session is in BIC review state; if so, require BIC capability
    const sessionCheck = await ContractService.getSession(req.params.sessionId, workspaceId);
    if (sessionCheck && sessionCheck.status === 'bic_review_required') {
      const permissions = getUserPermissions(req);
      const role = ((req as any).user?.role || (req as any).authUser?.role || '').toLowerCase();
      if (!permissions.includes('contract_bic_review') && !['bic', 'broker_in_charge'].includes(role)) {
        return res.status(403).json({
          success: false,
          error: 'FORBIDDEN_BIC_CAPABILITY_REQUIRED',
          message: 'Forbidden: Explicit contract_bic_review capability required to resolve BIC review.'
        });
      }
    }

    const actorCapability = getActorCapability(req);
    const { sessionId } = req.params;

    const session = await ContractService.requestDraft(sessionId, workspaceId, actorUserId, actorCapability);
    return res.json({ success: true, session });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// 9. GET /api/contracts/intake-sessions/:sessionId/draft
contractRouter.get('/intake-sessions/:sessionId/draft', requireContractCapability, async (req: Request, res: Response) => {
  try {
    const workspaceId = getWorkspaceId(req);
    const { sessionId } = req.params;

    const session = await ContractService.getSession(sessionId, workspaceId);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Contract intake session not found.' });
    }

    if (!session.draftManifest) {
      return res.status(404).json({ success: false, error: 'Draft manifest not generated for this session.' });
    }

    return res.json({ success: true, draftManifest: session.draftManifest });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 10. POST /api/contracts/intake-sessions/:sessionId/approve-draft
contractRouter.post('/intake-sessions/:sessionId/approve-draft', requireContractCapability, async (req: Request, res: Response) => {
  try {
    const workspaceId = getWorkspaceId(req);
    const actorUserId = getActorUserId(req);
    const actorCapability = getActorCapability(req);
    const { sessionId } = req.params;

    const session = await ContractService.approveDraft(sessionId, workspaceId, actorUserId, actorCapability);
    return res.json({ success: true, session });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// 11. POST /api/contracts/intake-sessions/:sessionId/cancel
contractRouter.post('/intake-sessions/:sessionId/cancel', requireContractCapability, async (req: Request, res: Response) => {
  try {
    const workspaceId = getWorkspaceId(req);
    const actorUserId = getActorUserId(req);
    const actorCapability = getActorCapability(req);
    const { sessionId } = req.params;
    const { reason = 'Session cancelled by user' } = req.body || {};

    const session = await ContractService.cancelSession(sessionId, workspaceId, reason, actorUserId, actorCapability);
    return res.json({ success: true, session });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// 12. POST /api/contracts/intake-sessions/:sessionId/voice-token (Issue Short-Lived Voice Authorization Token)
contractRouter.post('/intake-sessions/:sessionId/voice-token', requireContractCapability, async (req: Request, res: Response) => {
  try {
    const workspaceId = getWorkspaceId(req);
    const userId = getActorUserId(req);
    const capability = getActorCapability(req);
    const { sessionId } = req.params;

    // Verify session exists and belongs to workspace
    const session = await ContractService.getSession(sessionId, workspaceId);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Contract intake session not found.' });
    }

    const { token, payload } = ContractVoiceTokenService.createVoiceToken({
      userId,
      workspaceId,
      sessionId: session.id,
      capability
    });

    return res.json({
      success: true,
      voiceToken: token,
      expiresAt: payload.expiresAt,
      sessionId: session.id
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
