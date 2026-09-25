/**
 * @file outboundNotificationPolicy.ts
 * Single Authoritative Outbound Notification Policy Evaluator.
 * Unifies master safe mode, Nora automation mode, recipient suppression ledger,
 * test request isolation, and vendor dispatch state into truthful, staff-facing statuses.
 */

import {
  getNoraAutomationMode,
  isRecipientSuppressed
} from '../email/emailProvider.js';
import { checkOutbound, resolveOutboundMasterMode } from '../email/outboundGate.js';

export type OutboundPolicyState =
  | 'operational_live'
  | 'globally_paused'
  | 'recipient_suppressed'
  | 'test_request'
  | 'policy_unavailable';

export interface OutboundPolicyEvaluation {
  state: OutboundPolicyState;
  isAllowed: boolean;
  communicationBlockedByPolicy: boolean;
  bannerMessage: string | null;
  statusLabel: string;
  dotColor: string;
  vendorDispatch: boolean;
  vendorLabel: string;
  fullStatusText: string;
  reason?: string;
}

export interface OutboundPolicyOptions {
  recipientEmail?: string;
  requestId?: string;
  isTest?: boolean;
  title?: string;
  notes?: string;
  channel?: string;
  telephonyCallId?: string;
}

/**
 * Detects whether a request is explicitly a test request
 */
export function isTestDesignatedRequest(options?: OutboundPolicyOptions): boolean {
  if (!options) return false;
  if (options.isTest === true) return true;

  if (options.requestId && (options.requestId.startsWith('req_test_') || options.requestId.startsWith('tsk_test_'))) {
    return true;
  }

  if (options.telephonyCallId && options.telephonyCallId.toLowerCase().includes('test')) {
    return true;
  }

  const textToCheck = `${options.title || ''} ${options.notes || ''}`.toLowerCase();
  if (
    textToCheck.includes('[test]') ||
    textToCheck.includes('[synthetic test]') ||
    textToCheck.includes('synthetic version') ||
    textToCheck.includes('voice test') ||
    textToCheck.includes('call_79840ebe2d3c5c7c04510ae240b')
  ) {
    return true;
  }

  return false;
}

/**
 * Authoritative evaluation of outbound communication policy for a request and/or recipient.
 */
export async function evaluateEffectiveOutboundPolicy(
  options: OutboundPolicyOptions = {}
): Promise<OutboundPolicyEvaluation> {
  try {
    const vendorDispatch = process.env.ALLOW_EXTERNAL_DISPATCH === 'true';
    const vendorLabel = vendorDispatch ? 'Vendor dispatch enabled' : 'Vendor dispatch disabled';

    // 1. Check if request is a test request
    if (isTestDesignatedRequest(options)) {
      return {
        state: 'test_request',
        isAllowed: false,
        communicationBlockedByPolicy: true,
        bannerMessage: 'Outbound communications suppressed for test request',
        statusLabel: 'Test Request (Suppressed)',
        dotColor: 'bg-amber-500',
        vendorDispatch,
        vendorLabel,
        fullStatusText: `Test Request (Suppressed) • ${vendorLabel}`,
        reason: 'test_request'
      };
    }

    // 2. Check Global Outbound Master Mode
    const masterMode = resolveOutboundMasterMode();
    const masterHeld = masterMode === 'hold' && !checkOutbound({
      to: options.recipientEmail,
      channel: options.channel || 'email',
      source: 'outboundNotificationPolicy',
    }).allowed;
    if (masterMode === 'disabled' || masterHeld) {
      return {
        state: 'globally_paused',
        isAllowed: false,
        communicationBlockedByPolicy: true,
        bannerMessage: 'Client notifications paused by policy',
        statusLabel: masterHeld ? 'Client Notifications: Hold Mode' : 'Client Notifications: Paused by Policy',
        dotColor: masterHeld ? 'bg-amber-500' : 'bg-slate-400',
        vendorDispatch,
        vendorLabel,
        fullStatusText: `Client notifications paused by policy • ${vendorLabel}`,
        reason: masterHeld ? 'master_mode_hold' : 'master_mode_disabled'
      };
    }

    // 3. Check Nora Automation Mode
    const noraMode = getNoraAutomationMode();
    if (noraMode !== 'live') {
      return {
        state: 'globally_paused',
        isAllowed: false,
        communicationBlockedByPolicy: true,
        bannerMessage: 'Client notifications paused by policy',
        statusLabel: `Client Notifications: ${noraMode === 'shadow' ? 'Shadow' : 'Hold'} Mode`,
        dotColor: 'bg-amber-500',
        vendorDispatch,
        vendorLabel,
        fullStatusText: `Client notifications paused by policy • ${vendorLabel}`,
        reason: `nora_mode_${noraMode}`
      };
    }

    // 4. Check Recipient Suppression
    if (options.recipientEmail) {
      const suppression = await isRecipientSuppressed(options.recipientEmail);
      if (suppression.suppressed) {
        return {
          state: 'recipient_suppressed',
          isAllowed: false,
          communicationBlockedByPolicy: true,
          bannerMessage: 'Outbound email to this recipient is paused (suppression active)',
          statusLabel: 'Recipient Suppressed',
          dotColor: 'bg-rose-500',
          vendorDispatch,
          vendorLabel,
          fullStatusText: `Recipient Suppressed • ${vendorLabel}`,
          reason: suppression.reason || 'recipient_suppressed'
        };
      }
    }

    // 5. Operational Email Enabled (Live)
    return {
      state: 'operational_live',
      isAllowed: true,
      communicationBlockedByPolicy: false,
      bannerMessage: null,
      statusLabel: 'Client Notifications: Live',
      dotColor: 'bg-emerald-500',
      vendorDispatch,
      vendorLabel,
      fullStatusText: `Client Notifications: Live • ${vendorLabel}`
    };
  } catch (err: any) {
    console.error('[OutboundPolicy] Evaluation failed:', err);
    return {
      state: 'policy_unavailable',
      isAllowed: false,
      communicationBlockedByPolicy: false,
      bannerMessage: null,
      statusLabel: 'Communication status unavailable',
      dotColor: 'bg-slate-400',
      vendorDispatch: false,
      vendorLabel: 'Vendor dispatch disabled',
      fullStatusText: 'Communication status unavailable',
      reason: err?.message || 'evaluation_error'
    };
  }
}
