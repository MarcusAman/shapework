/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NORA Provider Contract — Standardized Provider Result Interface
 * 
 * Governing Principle:
 * "Every external adapter must return a common result contract.
 * FIXTURE results must never be presented as live. SANDBOX results must be
 * visibly identified as test data. DISCONNECTED must produce an honest
 * unavailable response. Production must fail closed if a provider silently
 * falls back to fixtures."
 */

import { ProviderMode } from '../truth/noraTruthEnvelope.js';

export interface ProviderResult<T = any> {
  ok: boolean;
  provider: string;
  mode: ProviderMode;
  workspaceId: string;
  retrievedAt: string;
  data?: T;
  providerRecordIds: string[];
  verifiedUrls?: string[];
  errorCode?: string;
  safeErrorMessage?: string;
  rawTelemetry?: Record<string, any>;
}

export class ProviderResultFactory {
  public static createLiveResult<T>(params: {
    provider: string;
    workspaceId: string;
    data: T;
    providerRecordIds?: string[];
    verifiedUrls?: string[];
    telemetry?: Record<string, any>;
  }): ProviderResult<T> {
    return {
      ok: true,
      provider: params.provider,
      mode: 'LIVE',
      workspaceId: params.workspaceId,
      retrievedAt: new Date().toISOString(),
      data: params.data,
      providerRecordIds: params.providerRecordIds || [],
      verifiedUrls: params.verifiedUrls || [],
      rawTelemetry: params.telemetry
    };
  }

  public static createSandboxResult<T>(params: {
    provider: string;
    workspaceId: string;
    data: T;
    providerRecordIds?: string[];
    verifiedUrls?: string[];
    telemetry?: Record<string, any>;
  }): ProviderResult<T> {
    return {
      ok: true,
      provider: params.provider,
      mode: 'SANDBOX',
      workspaceId: params.workspaceId,
      retrievedAt: new Date().toISOString(),
      data: params.data,
      providerRecordIds: params.providerRecordIds || [],
      verifiedUrls: params.verifiedUrls || [],
      rawTelemetry: params.telemetry
    };
  }

  public static createFixtureResult<T>(params: {
    provider: string;
    workspaceId: string;
    data: T;
    providerRecordIds?: string[];
    verifiedUrls?: string[];
    telemetry?: Record<string, any>;
  }): ProviderResult<T> {
    return {
      ok: true,
      provider: params.provider,
      mode: 'FIXTURE',
      workspaceId: params.workspaceId,
      retrievedAt: new Date().toISOString(),
      data: params.data,
      providerRecordIds: params.providerRecordIds || [],
      verifiedUrls: params.verifiedUrls || [],
      rawTelemetry: params.telemetry
    };
  }

  public static createDisconnectedResult<T = any>(params: {
    provider: string;
    workspaceId: string;
    reason?: string;
  }): ProviderResult<T> {
    return {
      ok: false,
      provider: params.provider,
      mode: 'DISCONNECTED',
      workspaceId: params.workspaceId,
      retrievedAt: new Date().toISOString(),
      providerRecordIds: [],
      verifiedUrls: [],
      errorCode: 'PROVIDER_DISCONNECTED',
      safeErrorMessage: params.reason || `The ${params.provider} integration is not connected for workspace ${params.workspaceId}.`
    };
  }

  public static createFailureResult<T = any>(params: {
    provider: string;
    workspaceId: string;
    mode?: ProviderMode;
    errorCode: string;
    safeErrorMessage: string;
    telemetry?: Record<string, any>;
  }): ProviderResult<T> {
    return {
      ok: false,
      provider: params.provider,
      mode: params.mode || 'LIVE',
      workspaceId: params.workspaceId,
      retrievedAt: new Date().toISOString(),
      providerRecordIds: [],
      verifiedUrls: [],
      errorCode: params.errorCode,
      safeErrorMessage: params.safeErrorMessage,
      rawTelemetry: params.telemetry
    };
  }
}
