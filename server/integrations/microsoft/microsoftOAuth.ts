/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';
import * as msal from '@azure/msal-node';
import { getMicrosoftConfig } from './microsoftConfig.js';
import { encryptToken, decryptToken } from '../shared/integrationCredentialVault.js';
import { logIntegrationAudit } from '../shared/integrationAudit.js';
import { WorkspaceIntegrationConnection } from '../shared/integrationTypes.js';

export interface OAuthStateData {
  workspaceId: string;
  userId: string;
  expiresAt: number;
  nonce: string;
}

export const microsoftActiveStates = new Map<string, OAuthStateData>();

export function generateMicrosoftOAuthState(workspaceId: string, userId: string): string {
  const nonce = crypto.randomBytes(16).toString('hex');
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  const stateToken = crypto.randomBytes(32).toString('hex');

  microsoftActiveStates.set(stateToken, {
    workspaceId,
    userId,
    expiresAt,
    nonce
  });

  return stateToken;
}

export function validateMicrosoftOAuthState(stateToken: string, workspaceId: string, userId: string): boolean {
  const stateData = microsoftActiveStates.get(stateToken);
  if (!stateData) return false;
  if (stateData.workspaceId !== workspaceId || stateData.userId !== userId) return false;
  if (Date.now() > stateData.expiresAt) return false;

  microsoftActiveStates.delete(stateToken);
  return true;
}

export function getMsalClient() {
  const config = getMicrosoftConfig();
  const msalConfig: msal.Configuration = {
    auth: {
      clientId: config.clientId,
      authority: `https://login.microsoftonline.com/${config.tenantId}`,
      clientSecret: config.clientSecret
    }
  };
  return new msal.ConfidentialClientApplication(msalConfig);
}

export async function getMicrosoftAuthUrl(state: string, scopes: string[]): Promise<string> {
  const msalClient = getMsalClient();
  const config = getMicrosoftConfig();
  return await msalClient.getAuthCodeUrl({
    scopes,
    redirectUri: config.redirectUri,
    state
  });
}

export async function exchangeMicrosoftCode(code: string, scopes: string[]) {
  const isProd = process.env.APP_MODE === 'production' || process.env.NODE_ENV === 'production';
  const isMock = !isProd && (process.env.APP_MODE === 'development' || !process.env.MICROSOFT_CLIENT_ID);
  if (isMock) {
    return {
      email: 'mock.user@outlook.com',
      providerAccountId: 'mock_microsoft_id_123',
      tenantId: 'common',
      encryptedAccessToken: await encryptToken('mock_encrypted_access_token_ms_123'),
      encryptedRefreshToken: await encryptToken('mock_encrypted_refresh_token_ms_123'),
      accessTokenExpiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      scopes
    };
  }

  const config = getMicrosoftConfig();
  
  // Use direct token exchange to easily extract access/refresh tokens
  const params = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.redirectUri,
    scope: scopes.join(' ')
  });

  const url = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Token exchange failed with status ${response.status}: ${errorBody}`);
  }

  const payload = await response.json();
  const accessToken = payload.access_token;
  const refreshToken = payload.refresh_token;
  const expiresIn = payload.expires_in || 3600;

  // Resolve user identity from Graph /me endpoint
  const graphRes = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  let email = 'unknown@microsoft.com';
  let providerAccountId = '';

  if (graphRes.ok) {
    const profile = await graphRes.json();
    email = profile.mail || profile.userPrincipalName || email;
    providerAccountId = profile.id || '';
  }

  const encryptedAccessToken = await encryptToken(accessToken);
  const encryptedRefreshToken = refreshToken ? await encryptToken(refreshToken) : undefined;
  const accessTokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  return {
    email,
    providerAccountId,
    tenantId: config.tenantId,
    encryptedAccessToken,
    encryptedRefreshToken,
    accessTokenExpiresAt,
    scopes
  };
}

export async function getMicrosoftAccessToken(
  connection: WorkspaceIntegrationConnection,
  dbState: any,
  saveStateCallback: () => Promise<void>
): Promise<string> {
  const currentAccessToken = await decryptToken(connection.encryptedAccessToken);

  // Use token if valid (with 5-minute safety margin)
  if (connection.accessTokenExpiresAt) {
    const expiresTime = new Date(connection.accessTokenExpiresAt).getTime();
    if (Date.now() < expiresTime - 5 * 60 * 1000) {
      return currentAccessToken;
    }
  }

  if (!connection.encryptedRefreshToken) {
    throw new Error('Microsoft refresh token is missing. Please re-authenticate.');
  }

  console.log(`[Microsoft OAuth] Refreshing expired access token for workspace: ${connection.workspaceId}`);
  const decryptedRefresh = await decryptToken(connection.encryptedRefreshToken);
  const config = getMicrosoftConfig();

  try {
    const params = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: decryptedRefresh,
      scope: connection.scopes.join(' ')
    });

    const url = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Token refresh failed with status ${response.status}: ${errorBody}`);
    }

    const payload = await response.json();
    const newAccessToken = payload.access_token;
    const newRefreshToken = payload.refresh_token || decryptedRefresh;
    const expiresIn = payload.expires_in || 3600;

    const encAccess = await encryptToken(newAccessToken);
    const encRefresh = await encryptToken(newRefreshToken);

    connection.encryptedAccessToken = encAccess;
    connection.encryptedRefreshToken = encRefresh;
    connection.accessTokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
    connection.status = 'connected';
    delete connection.lastError;

    logIntegrationAudit(
      dbState,
      connection.workspaceId,
      'System Scheduler',
      'System',
      'Microsoft 365 OAuth token refresh succeeded',
      'Microsoft 365'
    );

    await saveStateCallback();
    return newAccessToken;
  } catch (err: any) {
    console.error(`[Microsoft OAuth] Token refresh failed for workspace ${connection.workspaceId}:`, err.message);

    connection.status = 'expired';
    connection.lastError = `Token refresh failed: ${err.message}`;

    logIntegrationAudit(
      dbState,
      connection.workspaceId,
      'System Scheduler',
      'System',
      `Microsoft 365 OAuth token refresh failed: ${err.message}`,
      'Microsoft 365'
    );

    await saveStateCallback();
    throw err;
  }
}
