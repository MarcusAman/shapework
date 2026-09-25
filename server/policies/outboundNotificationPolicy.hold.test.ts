import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { checkOutbound } from '../email/outboundGate.js';

const provider = vi.hoisted(() => ({ suppression: vi.fn(), sendEmail: vi.fn() }));
vi.mock('../email/emailProvider.js', () => ({
  getOutboundMasterMode: () => {
    const value = (process.env.OUTBOUND_MASTER_MODE || process.env.OUTBOUND_MODE || 'hold').trim().toLowerCase();
    return value === 'hold' || value === 'live' ? value : 'disabled';
  },
  getNoraAutomationMode: () => process.env.NORA_AUTOMATION_MODE || 'shadow',
  isRecipientSuppressed: provider.suppression,
  sendEmail: provider.sendEmail,
}));

import { evaluateEffectiveOutboundPolicy } from './outboundNotificationPolicy.js';

describe('notification status agrees with the outbound transport gate', () => {
  beforeEach(() => {
    vi.stubEnv('OUTBOUND_MASTER_MODE', 'hold');
    vi.stubEnv('OUTBOUND_MODE', 'enabled');
    vi.stubEnv('NORA_AUTOMATION_MODE', 'live');
    vi.stubEnv('ALLOW_EXTERNAL_DISPATCH', 'false');
    provider.suppression.mockReset().mockResolvedValue({ suppressed: false });
    provider.sendEmail.mockClear();
  });

  afterEach(() => {
    expect(provider.sendEmail).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it.each([
    ['marcus@shapework.co', 'false', 'email'],
    ['melissa.gagliardi@nestrealty.com', 'false', 'email'],
    ['melissa.gagliardi@nestrealty.com', 'true', 'email'],
    [undefined, 'true', 'email'],
    ['marcus@shapework.co', 'true', 'sms'],
  ])('reports held for %s with external dispatch %s on %s', async (recipientEmail, external, channel) => {
    vi.stubEnv('ALLOW_EXTERNAL_DISPATCH', external);
    expect(checkOutbound({ to: recipientEmail, channel }).allowed).toBe(false);
    const result = await evaluateEffectiveOutboundPolicy({ recipientEmail, channel });
    expect(result).toMatchObject({
      state: 'globally_paused', isAllowed: false, communicationBlockedByPolicy: true,
      reason: 'master_mode_hold', statusLabel: 'Client Notifications: Hold Mode',
    });
    expect(result.fullStatusText).not.toContain('Notifications: Live');
  });

  it('retains the existing allowlisted hold exception only for an eligible recipient', async () => {
    vi.stubEnv('ALLOW_EXTERNAL_DISPATCH', 'true');
    const recipientEmail = 'marcus@shapework.co';
    expect(checkOutbound({ to: recipientEmail }).allowed).toBe(true);
    expect(await evaluateEffectiveOutboundPolicy({ recipientEmail })).toMatchObject({
      state: 'operational_live', isAllowed: true, communicationBlockedByPolicy: false,
    });
  });

  it.each(['disabled', 'enabled', ''])('reports master %s as disabled like the transport', async (mode) => {
    vi.stubEnv('OUTBOUND_MASTER_MODE', mode);
    vi.stubEnv('OUTBOUND_MODE', 'live');
    expect(checkOutbound({ to: 'marcus@shapework.co' }).allowed).toBe(false);
    expect(await evaluateEffectiveOutboundPolicy({ recipientEmail: 'marcus@shapework.co' })).toMatchObject({
      state: 'globally_paused', isAllowed: false, communicationBlockedByPolicy: true,
      reason: 'master_mode_disabled',
    });
  });

  it('reports live for live master and Nora modes', async () => {
    vi.stubEnv('OUTBOUND_MASTER_MODE', 'live');
    expect(await evaluateEffectiveOutboundPolicy({ recipientEmail: 'melissa.gagliardi@nestrealty.com' })).toMatchObject({
      state: 'operational_live', isAllowed: true, communicationBlockedByPolicy: false,
    });
  });

  it.each(['shadow', 'hold'])('preserves Nora %s pause even when the master permits sending', async (mode) => {
    vi.stubEnv('OUTBOUND_MASTER_MODE', 'live');
    vi.stubEnv('NORA_AUTOMATION_MODE', mode);
    expect(await evaluateEffectiveOutboundPolicy({ recipientEmail: 'marcus@shapework.co' })).toMatchObject({
      state: 'globally_paused', isAllowed: false, communicationBlockedByPolicy: true,
      reason: `nora_mode_${mode}`,
    });
  });

  it('preserves explicit test-request isolation before all sending modes', async () => {
    vi.stubEnv('ALLOW_EXTERNAL_DISPATCH', 'true');
    expect(await evaluateEffectiveOutboundPolicy({ recipientEmail: 'marcus@shapework.co', isTest: true })).toMatchObject({
      state: 'test_request', isAllowed: false, communicationBlockedByPolicy: true,
    });
  });

  it('preserves recipient suppression even for an allowlisted hold exception', async () => {
    vi.stubEnv('ALLOW_EXTERNAL_DISPATCH', 'true');
    provider.suppression.mockResolvedValue({ suppressed: true, reason: 'recipient_preference' });
    expect(await evaluateEffectiveOutboundPolicy({ recipientEmail: 'marcus@shapework.co' })).toMatchObject({
      state: 'recipient_suppressed', isAllowed: false, communicationBlockedByPolicy: true,
      reason: 'recipient_preference',
    });
  });
});
