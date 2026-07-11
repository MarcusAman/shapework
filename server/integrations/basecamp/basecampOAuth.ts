/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';
import { getBasecampConfig } from './basecampConfig.js';
import { credentialVault } from '../../security/vault.js';
import { BasecampConnection, BasecampIdentity } from './basecampTypes.js';

export interface OAuthStateData {
  workspaceId: string;
  userId: string;
  expiresAt: number;
  nonce: string;
}

// In-memory state registry to protect callback loops
export const basecampActiveStates = new Map<string, OAuthStateData>();

export function generateOAuthState(workspaceId: string, userId: string): string {
  const nonce = crypto.randomBytes(16).toString('hex');
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minute expiration
  const stateToken = crypto.randomBytes(32).toString('hex');

  basecampActiveStates.set(stateToken, {
    workspaceId,
    userId,
    expiresAt,
    nonce
  });

  return stateToken;
}

export function validateOAuthState(stateToken: string, workspaceId: string, userId: string): boolean {
  const stateData = basecampActiveStates.get(stateToken);
  if (!stateData) return false;
  if (stateData.workspaceId !== workspaceId || stateData.userId !== userId) return false;
  if (Date.now() > stateData.expiresAt) return false;

  basecampActiveStates.delete(stateToken);
  return true;
}

export interface TokenExchangeResult {
  encryptedAccessToken: string;
  encryptedRefreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt?: string;
}

export async function exchangeCode(code: string): Promise<TokenExchangeResult> {
  const config = getBasecampConfig();
  if (!config.clientId || !config.clientSecret) {
    throw new Error('Basecamp Client ID or Client Secret is not configured.');
  }

  // 37signals Launchpad expects form-urlencoded parameters
  const params = new URLSearchParams({
    type: 'web_server',
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    code: code
  });

  const response = await fetch('https://launchpad.37signals.com/authorization/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': config.userAgent
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
  const expiresIn = payload.expires_in || 1209600; // Default is 2 weeks

  const encryptedAccessToken = await credentialVault.encrypt(accessToken);
  const encryptedRefreshToken = await credentialVault.encrypt(refreshToken);
  
  const accessTokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  return {
    encryptedAccessToken,
    encryptedRefreshToken,
    accessTokenExpiresAt
  };
}

export async function getOAuthIdentity(accessToken: string): Promise<BasecampIdentity> {
  const config = getBasecampConfig();
  const response = await fetch('https://launchpad.37signals.com/authorization.json', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'User-Agent': config.userAgent
    }
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to fetch identity with status ${response.status}: ${errorBody}`);
  }

  return await response.json();
}

export async function getAuthenticatedToken(
  connection: BasecampConnection,
  dbState: any,
  saveDbStateCallback: () => Promise<void>
): Promise<string> {
  const config = getBasecampConfig();

  // Decrypt the current access token
  const currentToken = await credentialVault.decrypt<string>(connection.encryptedAccessToken);

  // If token is not expired, return it (with a 5-minute safety margin)
  if (connection.accessTokenExpiresAt) {
    const expiresTime = new Date(connection.accessTokenExpiresAt).getTime();
    if (Date.now() < expiresTime - 5 * 60 * 1000) {
      return currentToken;
    }
  }

  // Refresh token is required to get a new access token
  if (!connection.encryptedRefreshToken) {
    throw new Error('Basecamp refresh token is missing. Please re-authenticate.');
  }

  console.log(`[Basecamp OAuth] Refreshing expired access token for workspace: ${connection.workspaceId}`);
  const decryptedRefresh = await credentialVault.decrypt<string>(connection.encryptedRefreshToken);

  try {
    const params = new URLSearchParams({
      type: 'refresh',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: decryptedRefresh
    });

    const response = await fetch('https://launchpad.37signals.com/authorization/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': config.userAgent
      },
      body: params.toString()
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Token refresh failed with status ${response.status}: ${errorBody}`);
    }

    const payload = await response.json();
    const newAccessToken = payload.access_token;
    const newRefreshToken = payload.refresh_token || decryptedRefresh; // Use new refresh token if returned
    const expiresIn = payload.expires_in || 1209600;

    const encAccess = await credentialVault.encrypt(newAccessToken);
    const encRefresh = await credentialVault.encrypt(newRefreshToken);

    connection.encryptedAccessToken = encAccess;
    connection.encryptedRefreshToken = encRefresh;
    connection.accessTokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
    connection.status = 'connected';
    delete connection.lastError;

    // Log refresh audit
    const refreshAudit = {
      id: `audit_bc_refresh_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      workspaceId: connection.workspaceId,
      timestamp: new Date().toISOString(),
      user_name: 'System Scheduler',
      user_role: 'System',
      action_description: 'Basecamp OAuth token refresh succeeded',
      impact_area: 'Integrations',
      impact_property: 'Basecamp',
      rollback_available: false
    };
    if (!dbState.auditEvents) dbState.auditEvents = [];
    dbState.auditEvents = [refreshAudit, ...dbState.auditEvents];

    await saveDbStateCallback();
    return newAccessToken;
  } catch (err: any) {
    console.error(`[Basecamp OAuth] Refresh token failed for workspace ${connection.workspaceId}:`, err.message);
    
    connection.status = 'expired';
    connection.lastError = `Token refresh failed: ${err.message}`;

    const failAudit = {
      id: `audit_bc_refresh_fail_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      workspaceId: connection.workspaceId,
      timestamp: new Date().toISOString(),
      user_name: 'System Scheduler',
      user_role: 'System',
      action_description: `Basecamp OAuth token refresh failed: ${err.message}`,
      impact_area: 'Integrations',
      impact_property: 'Basecamp',
      rollback_available: false
    };
    if (!dbState.auditEvents) dbState.auditEvents = [];
    dbState.auditEvents = [failAudit, ...dbState.auditEvents];

    await saveDbStateCallback();
    throw err;
  }
}
