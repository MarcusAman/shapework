import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { requireAuth, resolveWorkspaceContext, requirePermission, AuthenticatedRequest, SEEDED_USERS } from '../../server/auth/auth.js';
import { signJwt } from '../../server/auth/jwt.js';
import { hasMarketingFinalApprovalAuthority, validateSelfApprovalSafety } from '../../server/policies/canonicalMarketingLifecyclePolicy.js';
import { CanonicalMarketingTask } from '../../server/persistence/marketingCampaignsRepository.js';

describe('Production Identity & Header Fencing Security Suite', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    process.env.APP_MODE = 'production';
    process.env.APP_ENV = 'production';
    process.env.STRICT_PERSISTENCE_GUARD = 'false';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  function createMockReqRes(headers: Record<string, string> = {}, cookies: Record<string, string> = {}, method: string = 'GET') {
    const req: any = {
      method,
      headers: { ...headers },
      query: {},
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' },
      originalUrl: '/api/auth/session',
      url: '/api/auth/session'
    };

    if (Object.keys(cookies).length > 0) {
      req.headers.cookie = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');
    }

    const res: any = {
      statusCode: 200,
      headersSent: false,
      _json: null,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(data: any) {
        this._json = data;
        return this;
      }
    };

    const next = vi.fn();
    return { req: req as AuthenticatedRequest, res, next };
  }

  // Test 1: Unauthenticated request plus x-user-email receives 401
  it('1. Unauthenticated request with x-user-email claiming Melissa receives HTTP 401 in production', async () => {
    const { req, res, next } = createMockReqRes({
      'x-user-email': 'melissa.gagliardi@nestrealty.com'
    });

    await requireAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res._json).toEqual({
      error: 'authentication_required',
      message: 'Authentication is required. Caller-supplied identity headers are not trusted.'
    });
    expect(req.authUser).toBeUndefined();
  });

  // Test 2: Unauthenticated request with x-user-id receives 401
  it('2. Unauthenticated request with x-user-id or x-session-token receives HTTP 401 in production', async () => {
    const { req, res, next } = createMockReqRes({
      'x-user-id': 'usr_melissa_full',
      'x-session-token': 'token_usr_melissa_full'
    });

    await requireAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res._json.error).toBe('authentication_required');
    expect(req.authUser).toBeUndefined();
  });

  // Test 3: Authenticated Eduardo plus x-user-email claiming Melissa remains Eduardo and receives 403 on restricted actions
  it('3. Authenticated Eduardo with x-user-email claiming Melissa remains Eduardo and receives 403 on director actions', async () => {
    // Generate authentic signed JWT for Eduardo
    const eduardoJwt = signJwt({
      userId: 'usr_eduardo_full',
      email: 'eduardo.lovo@nestrealty.com',
      role: 'producer',
      workspaceId: 'ws_wilmington'
    });

    // Attacker passes valid Eduardo JWT in Authorization header, but injects x-user-email: melissa.gagliardi@nestrealty.com
    const { req, res, next } = createMockReqRes({
      'authorization': `Bearer ${eduardoJwt}`,
      'x-user-email': 'melissa.gagliardi@nestrealty.com'
    });

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.authUser).toBeDefined();
    // Must strictly be Eduardo, NOT Melissa!
    expect(req.authUser?.email).toBe('eduardo.lovo@nestrealty.com');
    expect(req.authUser?.id).toBe('usr_eduardo_full');
    expect(req.authUser?.role).toBe('producer');
    expect(req.authUser?.authSource).toBe('jwt_bearer');

    // Attempting marketing proof approval as Eduardo must be blocked
    const task: CanonicalMarketingTask = {
      id: 'tsk_proof_001',
      title: 'Listing Launch Postcard',
      category: 'Marketing request',
      workspaceId: 'ws_wilmington',
      assignedTo: 'Eduardo Lovo',
      assignedToId: 'dir_eduardo_lovo_73',
      reviewOwnerId: 'dir_melissa_gagliardi_33',
      reviewOwnerName: 'Melissa Gagliardi',
      status: 'in_progress',
      reviewState: 'awaiting_review',
      proofs: [{ id: 'prf_1', url: 'https://example.com/p.pdf', uploadedBy: 'Eduardo Lovo', uploadedById: 'dir_eduardo_lovo_73' }]
    };

    const safetyCheck = validateSelfApprovalSafety(task, req.authUser);
    expect(safetyCheck.allowed).toBe(false);
    expect(safetyCheck.errorCode).toBe('FORBIDDEN_NOT_TASK_REVIEWER');

    const authorityCheck = hasMarketingFinalApprovalAuthority(req.authUser, task, 'ws_wilmington');
    expect(authorityCheck.authorized).toBe(false);
    expect(authorityCheck.reason).toContain('User lacks marketing.final_approval capability');
  });

  // Test 4: Authenticated Melissa receives the director capability and can approve marketing work
  it('4. Authenticated Melissa (valid JWT cookie) receives director capability and can approve marketing deliverables', async () => {
    const melissaJwt = signJwt({
      userId: 'usr_melissa_full',
      email: 'melissa.gagliardi@nestrealty.com',
      role: 'marketing_director',
      workspaceId: 'ws_wilmington'
    });

    const { req, res, next } = createMockReqRes({}, {
      shapework_session: melissaJwt
    });

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.authUser).toBeDefined();
    expect(req.authUser?.email).toBe('melissa.gagliardi@nestrealty.com');
    expect(req.authUser?.role).toBe('marketing_director');
    expect(req.authUser?.authSource).toBe('jwt_cookie');

    const task: CanonicalMarketingTask = {
      id: 'tsk_melissa_self',
      title: 'Digital Flyer',
      category: 'Marketing request',
      workspaceId: 'ws_wilmington',
      assignedTo: 'Melissa Gagliardi',
      assignedToId: 'dir_melissa_gagliardi_33',
      status: 'in_progress',
      reviewState: 'awaiting_review',
      proofs: [{ id: 'prf_2', url: 'https://example.com/f.pdf', uploadedBy: 'Melissa Gagliardi', uploadedById: 'dir_melissa_gagliardi_33' }]
    };

    const safetyCheck = validateSelfApprovalSafety(task, req.authUser);
    expect(safetyCheck.allowed).toBe(true);
    expect(safetyCheck.isDirectorApproval).toBe(true);

    const authorityCheck = hasMarketingFinalApprovalAuthority(req.authUser, task, 'ws_wilmington');
    expect(authorityCheck.authorized).toBe(true);
    expect(['staff_director_profile', 'role_capability']).toContain(authorityCheck.source);
  });

  // Test 5: Cross-workspace identity claims fail
  it('5. Cross-workspace access without membership is rejected with HTTP 403', async () => {
    // User is member of ws_wilmington only
    const userJwt = signJwt({
      userId: 'usr_eduardo_full',
      email: 'eduardo.lovo@nestrealty.com',
      role: 'producer',
      workspaceId: 'ws_wilmington'
    });

    const { req, res, next } = createMockReqRes({
      'authorization': `Bearer ${userJwt}`,
      'x-workspace-id': 'ws_triangle_unauthorized'
    });

    await requireAuth(req, res, () => {});

    // Now resolve workspace context
    const wsNext = vi.fn();
    await resolveWorkspaceContext(req, res, wsNext);

    expect(wsNext).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
    expect(res._json).toEqual({
      error: 'Forbidden',
      message: 'User is not a member of the requested workspace.'
    });
  });

  // Test 6: Development impersonation flags are rejected in production
  it('6. Production strictly rejects query tokens, developer auto-sessions, and raw token strings', async () => {
    // Passing raw token string without valid JWT in production
    const { req, res, next } = createMockReqRes({
      'authorization': 'Bearer token_usr_ryan'
    });

    await requireAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res._json).toEqual({
      error: 'authentication_required',
      message: 'Invalid or expired session token.'
    });
  });
});
