import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ recipient: vi.fn(), listFiles: vi.fn() }));
vi.mock('./canonicalRecipientService.js', () => ({ resolveServerCanonicalRecipient: mocks.recipient }));
vi.mock('./googleDriveService.js', () => ({ GoogleDriveService: { listFilesInFolder: mocks.listFiles } }));

import { checkOutbound } from '../email/outboundGate.js';
import { DISPATCH_REASON, dispatchRejectBody, evaluateDispatch } from './evaluateDispatch.js';

const marcus = 'marcus@shapework.co';
const cc = ['melissa.gagliardi@nestrealty.com', 'marcus.aman@gmail.com'];

describe('dispatch recipient identity and outbound policy metadata', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('APP_MODE', 'production');
    vi.stubEnv('OUTBOUND_MASTER_MODE', 'disabled');
    vi.stubEnv('ALLOW_EXTERNAL_DISPATCH', 'false');
    mocks.recipient.mockReset().mockResolvedValue(null);
    mocks.listFiles.mockReset();
  });
  afterEach(() => {
    expect(mocks.listFiles).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  const evaluate = (email: string | undefined, mode: string) => evaluateDispatch({
    task: { id: 'task-policy', workspaceId: 'ws_wilmington', agentEmail: email },
    actor: { id: 'reviewer' },
    recipient: { email },
    intent: 'ask_missing',
    outboundMode: mode,
    cc,
  });

  it.each(['disabled', 'live'])('explains why the test recipient is unresolved in %s without authorizing it', async (mode) => {
    const result = await evaluate(marcus, mode);
    expect(result).toMatchObject({
      allowed: false, reason: DISPATCH_REASON.recipient, recipientStatus: 'unresolved',
      recipientId: null, effectiveTo: [], effectiveCc: [], recipientBlockReason: 'test_recipient_policy',
      outboundPolicy: { mode, allowed: mode === 'live', reason: mode === 'live' ? 'live' : 'outbound_disabled' },
    });
    expect(result.dropped).toEqual([marcus, ...cc].map(email => ({ email, reason: DISPATCH_REASON.recipient })));
    expect(dispatchRejectBody(result)).toMatchObject({
      code: 'RECIPIENT_UNRESOLVED', recipientBlockReason: 'test_recipient_policy',
      outboundPolicy: result.outboundPolicy, effectiveTo: [], effectiveCc: [],
    });
  });

  it.each(['false', 'true'])('keeps held test-recipient eligibility distinct from actual transport allowance (%s)', async (external) => {
    vi.stubEnv('ALLOW_EXTERNAL_DISPATCH', external);
    const result = await evaluate(marcus, 'hold');
    expect(result).toMatchObject({
      allowed: true, reason: '', recipientStatus: 'allowlisted_prove', recipientId: null,
      effectiveTo: [marcus], effectiveCc: ['marcus.aman@gmail.com'], recipientBlockReason: null,
      outboundPolicy: { mode: 'hold', allowed: external === 'true', reason: external === 'true' ? 'allowlist' : 'held' },
    });
    const gate = checkOutbound({ to: result.effectiveTo, cc: result.effectiveCc, mode: 'hold' });
    expect(result.outboundPolicy.allowed).toBe(gate.allowed);
    expect(result.outboundPolicy.reason).toBe(gate.reason);
    expect(result.effectiveCc).not.toContain('melissa.gagliardi@nestrealty.com');
  });

  it.each(['disabled', 'hold', 'live'])('keeps unknown directory email unresolved in %s', async (mode) => {
    const result = await evaluate('unknown.agent@nestrealty.com', mode);
    expect(result).toMatchObject({
      allowed: false, reason: DISPATCH_REASON.recipient, recipientStatus: 'unresolved',
      recipientId: null, recipientBlockReason: 'directory_unresolved', effectiveTo: [], effectiveCc: [],
    });
  });

  it.each(['disabled', 'hold', 'live'])('identifies missing email in %s', async (mode) => {
    const result = await evaluate(undefined, mode);
    expect(result).toMatchObject({
      allowed: false, reason: DISPATCH_REASON.recipient, recipientStatus: 'unresolved',
      recipientBlockReason: 'missing_email', effectiveTo: [], effectiveCc: [],
    });
  });

  it('retains a production directory identity and its recipients when outbound is disabled', async () => {
    mocks.recipient.mockResolvedValue({ id: 'directory-agent' });
    const result = await evaluate('listed.agent@nestrealty.com', 'disabled');
    expect(result).toMatchObject({
      allowed: false, reason: DISPATCH_REASON.outbound, recipientStatus: 'directory',
      recipientId: 'directory-agent', recipientBlockReason: null,
      effectiveTo: ['listed.agent@nestrealty.com'], effectiveCc: cc, dropped: [],
      outboundPolicy: { mode: 'disabled', allowed: false, reason: 'outbound_disabled' },
    });
    expect(dispatchRejectBody(result).code).toBe('OUTBOUND_DISABLED');
  });

  it('reports unsupported mode as disabled just like the actual gate', async () => {
    const result = await evaluate(marcus, 'enabled');
    expect(result).toMatchObject({
      allowed: false, reason: DISPATCH_REASON.recipient, recipientBlockReason: 'test_recipient_policy',
      outboundPolicy: { mode: 'disabled', allowed: false, reason: 'outbound_disabled' },
    });
  });

  it('gives a real directory match precedence over test-recipient policy metadata', async () => {
    mocks.recipient.mockResolvedValue({ id: 'actual-directory-person' });
    expect(await evaluate(marcus, 'live')).toMatchObject({
      allowed: true, recipientStatus: 'directory', recipientId: 'actual-directory-person',
      recipientBlockReason: null, effectiveTo: [marcus], effectiveCc: cc,
    });
  });
});
