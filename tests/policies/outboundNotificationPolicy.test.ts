/**
 * @file outboundNotificationPolicy.test.ts
 * Tests for the unified outbound notification policy evaluator.
 * Verifies all 6 distinct states and staff-facing language.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  evaluateEffectiveOutboundPolicy,
  isTestDesignatedRequest
} from '../../server/policies/outboundNotificationPolicy.js';

describe('Outbound Notification Policy Evaluator', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('1. Returns operational_live when master=live, nora=live, vendor=false, recipient not suppressed', async () => {
    process.env.OUTBOUND_MASTER_MODE = 'live';
    process.env.NORA_AUTOMATION_MODE = 'live';
    process.env.ALLOW_EXTERNAL_DISPATCH = 'false';

    const policy = await evaluateEffectiveOutboundPolicy({
      recipientEmail: 'agent.wilmington@nestrealty.com',
      requestId: 'req_live_001',
      title: '212 Wetland Drive - Instagram Story'
    });

    expect(policy.state).toBe('operational_live');
    expect(policy.isAllowed).toBe(true);
    expect(policy.communicationBlockedByPolicy).toBe(false);
    expect(policy.bannerMessage).toBeNull();
    expect(policy.statusLabel).toBe('Client Notifications: Live');
    expect(policy.dotColor).toBe('bg-emerald-500');
    expect(policy.vendorDispatch).toBe(false);
    expect(policy.fullStatusText).toBe('Client Notifications: Live • Vendor dispatch disabled');
  });

  it('2. Returns globally_paused when master mode is disabled', async () => {
    process.env.OUTBOUND_MASTER_MODE = 'disabled';
    process.env.NORA_AUTOMATION_MODE = 'live';
    process.env.ALLOW_EXTERNAL_DISPATCH = 'false';

    const policy = await evaluateEffectiveOutboundPolicy({
      recipientEmail: 'matt.orr@nestrealty.com',
      requestId: 'req_paused_001'
    });

    expect(policy.state).toBe('globally_paused');
    expect(policy.isAllowed).toBe(false);
    expect(policy.communicationBlockedByPolicy).toBe(true);
    expect(policy.bannerMessage).toBe('Client notifications paused by policy');
    expect(policy.statusLabel).toBe('Client Notifications: Paused by Policy');
    expect(policy.dotColor).toBe('bg-slate-400');
    expect(policy.fullStatusText).toBe('Client notifications paused by policy • Vendor dispatch disabled');
  });

  it('3. Returns globally_paused when nora automation mode is hold', async () => {
    process.env.OUTBOUND_MASTER_MODE = 'live';
    process.env.NORA_AUTOMATION_MODE = 'hold';
    process.env.ALLOW_EXTERNAL_DISPATCH = 'false';

    const policy = await evaluateEffectiveOutboundPolicy({
      recipientEmail: 'matt.orr@nestrealty.com',
      requestId: 'req_nora_hold_001'
    });

    expect(policy.state).toBe('globally_paused');
    expect(policy.isAllowed).toBe(false);
    expect(policy.communicationBlockedByPolicy).toBe(true);
    expect(policy.bannerMessage).toBe('Client notifications paused by policy');
    expect(policy.fullStatusText).toBe('Client notifications paused by policy • Vendor dispatch disabled');
  });

  it('4. Returns recipient_suppressed for defensively blocked aliases', async () => {
    process.env.OUTBOUND_MASTER_MODE = 'live';
    process.env.NORA_AUTOMATION_MODE = 'live';
    process.env.ALLOW_EXTERNAL_DISPATCH = 'false';

    const policy = await evaluateEffectiveOutboundPolicy({
      recipientEmail: 'morr@nestrealty.com',
      requestId: 'req_suppressed_alias_001'
    });

    expect(policy.state).toBe('recipient_suppressed');
    expect(policy.isAllowed).toBe(false);
    expect(policy.communicationBlockedByPolicy).toBe(true);
    expect(policy.bannerMessage).toBe('Outbound email to this recipient is paused (suppression active)');
    expect(policy.statusLabel).toBe('Recipient Suppressed');
    expect(policy.dotColor).toBe('bg-rose-500');
    expect(policy.fullStatusText).toBe('Recipient Suppressed • Vendor dispatch disabled');
  });

  it('5. Returns test_request when request is designated as test', async () => {
    process.env.OUTBOUND_MASTER_MODE = 'live';
    process.env.NORA_AUTOMATION_MODE = 'live';
    process.env.ALLOW_EXTERNAL_DISPATCH = 'false';

    const policy = await evaluateEffectiveOutboundPolicy({
      recipientEmail: 'matt.orr@nestrealty.com',
      requestId: 'req_test_synthetic_24',
      title: '[SYNTHETIC TEST] Open House Flyer',
      notes: 'Voice test call_79840ebe2d3c5c7c04510ae240b'
    });

    expect(policy.state).toBe('test_request');
    expect(policy.isAllowed).toBe(false);
    expect(policy.communicationBlockedByPolicy).toBe(true);
    expect(policy.bannerMessage).toBe('Outbound communications suppressed for test request');
    expect(policy.statusLabel).toBe('Test Request (Suppressed)');
    expect(policy.dotColor).toBe('bg-amber-500');
    expect(policy.fullStatusText).toBe('Test Request (Suppressed) • Vendor dispatch disabled');
  });

  it('6. Correctly evaluates vendor dispatch enabled when ALLOW_EXTERNAL_DISPATCH=true', async () => {
    process.env.OUTBOUND_MASTER_MODE = 'live';
    process.env.NORA_AUTOMATION_MODE = 'live';
    process.env.ALLOW_EXTERNAL_DISPATCH = 'true';

    const policy = await evaluateEffectiveOutboundPolicy({
      recipientEmail: 'agent.wilmington@nestrealty.com'
    });

    expect(policy.vendorDispatch).toBe(true);
    expect(policy.vendorLabel).toBe('Vendor dispatch enabled');
    expect(policy.fullStatusText).toBe('Client Notifications: Live • Vendor dispatch enabled');
  });

  it('7. Identifies test-designated requests correctly via isTestDesignatedRequest', () => {
    expect(isTestDesignatedRequest({ isTest: true })).toBe(true);
    expect(isTestDesignatedRequest({ requestId: 'req_test_123' })).toBe(true);
    expect(isTestDesignatedRequest({ telephonyCallId: 'call_test_abc' })).toBe(true);
    expect(isTestDesignatedRequest({ title: 'Standard Open House Flyer' })).toBe(false);
    expect(isTestDesignatedRequest({ notes: 'Synthetic Version 24 test run' })).toBe(true);
  });
});
