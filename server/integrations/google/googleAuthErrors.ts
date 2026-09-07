/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Typed Google Authentication Failure Classifier & Policy Engine
 */

import { NoraActionLifecycleState } from '../../agent/types.js';

export type GoogleAuthFailure =
  | 'ACCESS_TOKEN_EXPIRED'
  | 'REFRESH_TOKEN_MISSING'
  | 'REFRESH_TOKEN_REVOKED'
  | 'REFRESH_TOKEN_EXPIRED'
  | 'INVALID_CLIENT'
  | 'INSUFFICIENT_SCOPE'
  | 'ACCOUNT_MISMATCH'
  | 'CALENDAR_PERMISSION_DENIED'
  | 'CALENDAR_NOT_FOUND'
  | 'RATE_LIMITED'
  | 'PROVIDER_UNAVAILABLE'
  | 'UNKNOWN_AUTH_FAILURE';

export interface GoogleAuthClassification {
  failure: GoogleAuthFailure;
  isRetryable: boolean;
  requiresReauth: boolean;
  requiresAdminCorrection: boolean;
  requiresCalendarReselection: boolean;
  userFacingMessage: string;
  lifecycleState: NoraActionLifecycleState;
  suggestedAction: string;
}

export function classifyGoogleAuthFailure(err: any): GoogleAuthClassification {
  if (!err) {
    return {
      failure: 'UNKNOWN_AUTH_FAILURE',
      isRetryable: false,
      requiresReauth: false,
      requiresAdminCorrection: false,
      requiresCalendarReselection: false,
      userFacingMessage: 'An unknown calendar provider error occurred.',
      lifecycleState: 'ACTION_FAILED_RETRYABLE',
      suggestedAction: 'Retry the request or contact administrator.'
    };
  }

  const msg = (err.message || '').toLowerCase();
  const code = err.code || err.status || err.response?.status;
  const errorData = err.response?.data?.error;
  const errorDesc = typeof errorData === 'string' ? errorData.toLowerCase() : (errorData?.message || errorData?.error_description || '').toLowerCase();

  // 1. Rate Limiting (429 / userRateLimitExceeded)
  if (code === 429 || msg.includes('rate limit') || msg.includes('userratelimitexceeded') || errorDesc.includes('quota') || msg.includes('quota exceeded')) {
    return {
      failure: 'RATE_LIMITED',
      isRetryable: true,
      requiresReauth: false,
      requiresAdminCorrection: false,
      requiresCalendarReselection: false,
      userFacingMessage: 'Google Calendar API rate limit reached. Retrying with backoff...',
      lifecycleState: 'ACTION_FAILED_RETRYABLE',
      suggestedAction: 'Retry with backoff.'
    };
  }

  // 2. Calendar Not Found (404)
  if (code === 404 || msg.includes('not found') || errorDesc.includes('notfound')) {
    return {
      failure: 'CALENDAR_NOT_FOUND',
      isRetryable: false,
      requiresReauth: false,
      requiresAdminCorrection: true,
      requiresCalendarReselection: true,
      userFacingMessage: 'The designated Google Calendar was not found. Please re-select the target calendar in Settings.',
      lifecycleState: 'ACTION_CALENDAR_CONFIGURATION_REQUIRED',
      suggestedAction: 'Reselect target calendar in Settings.'
    };
  }

  // 3. Permission Denied / Scope Issues (403)
  if (code === 403 || msg.includes('forbidden') || msg.includes('permission denied') || errorDesc.includes('permission')) {
    if (msg.includes('scope') || errorDesc.includes('insufficient') || msg.includes('insufficientpermissions')) {
      return {
        failure: 'INSUFFICIENT_SCOPE',
        isRetryable: false,
        requiresReauth: true,
        requiresAdminCorrection: true,
        requiresCalendarReselection: false,
        userFacingMessage: 'Google Workspace authorization lacks required Calendar permissions. Please reconnect AskNora@nestrealty.com with full calendar scopes.',
        lifecycleState: 'ACTION_REAUTH_REQUIRED',
        suggestedAction: 'Reconnect Google Workspace with required scopes.'
      };
    }
    return {
      failure: 'CALENDAR_PERMISSION_DENIED',
      isRetryable: false,
      requiresReauth: false,
      requiresAdminCorrection: true,
      requiresCalendarReselection: false,
      userFacingMessage: 'AskNora@nestrealty.com does not have write permissions on this Google Calendar. Please grant Owner or Writer access in Google Calendar settings.',
      lifecycleState: 'ACTION_CALENDAR_CONFIGURATION_REQUIRED',
      suggestedAction: 'Grant write permissions on the calendar.'
    };
  }

  // 4. Invalid Client (Configuration Failure)
  if (msg.includes('invalid_client') || errorDesc.includes('invalid_client') || msg.includes('unauthorized_client')) {
    return {
      failure: 'INVALID_CLIENT',
      isRetryable: false,
      requiresReauth: false,
      requiresAdminCorrection: true,
      requiresCalendarReselection: false,
      userFacingMessage: 'Google OAuth client configuration is invalid. Please verify Google Cloud OAuth credentials in environment settings.',
      lifecycleState: 'ACTION_FAILED_FINAL',
      suggestedAction: 'Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in environment.'
    };
  }

  // 5. Revoked or Expired Refresh Token (invalid_grant / invalid_request)
  if (msg.includes('invalid_grant') || errorDesc.includes('invalid_grant') || msg.includes('token has been expired or revoked') || msg.includes('invalid_request') || errorDesc.includes('invalid_request')) {
    return {
      failure: 'REFRESH_TOKEN_REVOKED',
      isRetryable: false,
      requiresReauth: true,
      requiresAdminCorrection: false,
      requiresCalendarReselection: false,
      userFacingMessage: 'Google Workspace grant was revoked, expired, or invalid. Please re-authenticate AskNora@nestrealty.com in Settings.',
      lifecycleState: 'ACTION_REAUTH_REQUIRED',
      suggestedAction: 'Re-authenticate Google Workspace in Settings.'
    };
  }

  // 6. Missing Refresh Token
  if (msg.includes('missing refresh token') || msg.includes('no refresh token') || msg.includes('google_calendar_connection_required') || msg.includes('google_workspace_reauth_required')) {
    return {
      failure: 'REFRESH_TOKEN_MISSING',
      isRetryable: false,
      requiresReauth: true,
      requiresAdminCorrection: false,
      requiresCalendarReselection: false,
      userFacingMessage: 'Google Workspace is not connected. Please connect AskNora@nestrealty.com in Settings.',
      lifecycleState: 'ACTION_REAUTH_REQUIRED',
      suggestedAction: 'Connect Google Workspace in Settings.'
    };
  }

  // 7. Expired Access Token (401 / Invalid Credentials) -> Automatic Self-Healing Refresh
  if (code === 401 || msg.includes('invalid authentication credentials') || msg.includes('expected oauth 2 access token') || msg.includes('token expired') || msg.includes('invalid credentials')) {
    return {
      failure: 'ACCESS_TOKEN_EXPIRED',
      isRetryable: true,
      requiresReauth: false,
      requiresAdminCorrection: false,
      requiresCalendarReselection: false,
      userFacingMessage: 'Google access token expired. Attempting automatic self-healing refresh...',
      lifecycleState: 'ACTION_EXECUTING',
      suggestedAction: 'Refresh token and retry once.'
    };
  }

  // 8. Provider Outage / Network Unavailable
  if (code >= 500 || msg.includes('unavailable') || msg.includes('econnrefused') || msg.includes('timeout') || msg.includes('etimedout')) {
    return {
      failure: 'PROVIDER_UNAVAILABLE',
      isRetryable: true,
      requiresReauth: false,
      requiresAdminCorrection: false,
      requiresCalendarReselection: false,
      userFacingMessage: 'Google Calendar service is temporarily unavailable. The meeting draft is preserved.',
      lifecycleState: 'ACTION_FAILED_RETRYABLE',
      suggestedAction: 'Retry once Google Calendar service recovers.'
    };
  }

  return {
    failure: 'UNKNOWN_AUTH_FAILURE',
    isRetryable: false,
    requiresReauth: false,
    requiresAdminCorrection: false,
    requiresCalendarReselection: false,
    userFacingMessage: `Google Calendar execution failure: ${err.message}`,
    lifecycleState: 'ACTION_FAILED_FINAL',
    suggestedAction: 'Inspect integration logs.'
  };
}
