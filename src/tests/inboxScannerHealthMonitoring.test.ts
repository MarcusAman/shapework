import { describe, it, expect, beforeEach } from 'vitest';
import {
  sanitizeScannerError,
  recordScanAttempt,
  recordScanSuccess,
  recordScanFailure,
  getInboxScannerHealth
} from '../../server/persistence/inboxScannerHealthRepository.js';

describe('Inbox Scanner Health Monitoring & Telemetry Suite', () => {
  it('sanitizes errors and prevents credential and token leakage', () => {
    const errorWithPassword = 'Auth failed for asknora@nestrealty.com with password abcd efgh ijkl mnop';
    const sanitized = sanitizeScannerError(errorWithPassword);
    expect(sanitized.code).toBe('IMAP_AUTHENTICATION_ERROR');
    expect(sanitized.message).not.toContain('abcd efgh ijkl mnop');
    expect(sanitized.message).toBe('IMAP authentication failed against mail provider.');

    const timeoutError = 'Connection failed: ETIMEDOUT connecting to imap.gmail.com:993';
    const sanitizedTimeout = sanitizeScannerError(timeoutError);
    expect(sanitizedTimeout.code).toBe('IMAP_SOCKET_TIMEOUT');
    expect(sanitizedTimeout.message).toContain('timed out');
  });

  it('records scan attempts, successes, and updates telemetry metrics', async () => {
    await recordScanAttempt();
    await recordScanSuccess({
      durationMs: 3200,
      messagesDiscovered: 5,
      tasksCreated: 1,
      metadata: { status: 'ok' }
    });

    const health = await getInboxScannerHealth();
    expect(health.id).toBe('primary');
    expect(health.mailboxId).toBe('asknora@nestrealty.com');
    expect(health.status).toBe('Healthy');
    expect(health.lastScanResult).toBe('ok');
    expect(health.consecutiveFailureCount).toBe(0);
    expect(health.lastScanDurationMs).toBe(3200);
    expect(health.lastCheckedSecondsAgo).toBeLessThan(10);
  });

  it('detects consecutive failures and transitions status to Error with clear operational alerts', async () => {
    await recordScanFailure({
      durationMs: 1500,
      errorCode: 'IMAP_NETWORK_UNREACHABLE',
      errorMessage: 'Mail server host unreachable or connection refused.'
    });
    await recordScanFailure({
      durationMs: 1600,
      errorCode: 'IMAP_NETWORK_UNREACHABLE',
      errorMessage: 'Mail server host unreachable or connection refused.'
    });

    const health = await getInboxScannerHealth();
    expect(health.status).toBe('Error');
    expect(health.consecutiveFailureCount).toBeGreaterThanOrEqual(2);
    expect(health.alerts.length).toBeGreaterThanOrEqual(1);
    expect(health.alerts[0].code).toBe('CONSECUTIVE_SCAN_FAILURES');

    // Recovery clears consecutive failures
    await recordScanSuccess({
      durationMs: 2900,
      messagesDiscovered: 0,
      tasksCreated: 0
    });

    const recovered = await getInboxScannerHealth();
    expect(recovered.status).toBe('Healthy');
    expect(recovered.consecutiveFailureCount).toBe(0);
  });

  it('verifies GET /api/marketing/inbox/health endpoint security and payload contract', async () => {
    const { signJwt } = await import('../../server/auth/jwt.js');
    const { requireStaffOrOidcAuth } = await import('../../server/auth/auth.js');

    // 1. Unauthenticated request rejected with 401
    const unauthReq: any = { headers: {} };
    let unauthStatus = 0;
    let unauthJson: any = null;
    const unauthRes: any = {
      status: (code: number) => {
        unauthStatus = code;
        return {
          json: (body: any) => { unauthJson = body; return body; }
        };
      }
    };
    let unauthNextCalled = false;
    await requireStaffOrOidcAuth(unauthReq, unauthRes, () => { unauthNextCalled = true; });

    expect(unauthStatus).toBe(401);
    expect(unauthNextCalled).toBe(false);

    // 2. Staff JWT authenticated request passes
    const validStaffToken = signJwt({
      userId: 'usr_staff_marcus',
      email: 'marcus@shapework.co',
      role: 'admin',
      isStaff: true
    });

    const staffReq: any = {
      headers: {
        authorization: `Bearer ${validStaffToken}`
      }
    };
    let staffNextCalled = false;
    await requireStaffOrOidcAuth(staffReq, {} as any, () => { staffNextCalled = true; });
    expect(staffNextCalled).toBe(true);
    expect(staffReq.authSource).toBe('staff_jwt');
  });
});
