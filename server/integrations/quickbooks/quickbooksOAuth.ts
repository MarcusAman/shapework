/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import OAuthClient from 'intuit-oauth';
import * as crypto from 'crypto';
import { getQuickBooksConfig } from './quickbooksConfig.js';
import { credentialVault } from '../../security/vault.js';
import { QuickBooksConnection } from './quickbooksTypes.js';

export interface OAuthStateData {
  workspaceId: string;
  userId: string;
  expiresAt: number;
  nonce: string;
}

// In-memory server-side state registry to protect callback loops
export const activeStates = new Map<string, OAuthStateData>();

export function createOAuthClient(): OAuthClient {
  const config = getQuickBooksConfig();
  if (!config.clientId) {
    throw new Error('QuickBooks Client ID is not configured.');
  }
  return new OAuthClient({
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    redirectUri: config.redirectUri,
    environment: config.environment,
    logging: false
  });
}

export function generateOAuthState(workspaceId: string, userId: string): string {
  const nonce = crypto.randomBytes(16).toString('hex');
  const stateToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

  activeStates.set(stateToken, {
    workspaceId,
    userId,
    expiresAt,
    nonce
  });

  return stateToken;
}

export function validateOAuthState(stateToken: string, expectedWorkspaceId: string, expectedUserId: string): boolean {
  const stateData = activeStates.get(stateToken);
  if (!stateData) {
    return false;
  }

  // Consume state immediately (single use)
  activeStates.delete(stateToken);

  if (Date.now() > stateData.expiresAt) {
    return false;
  }

  // Cross-tenant verification
  if (stateData.workspaceId !== expectedWorkspaceId || stateData.userId !== expectedUserId) {
    return false;
  }

  return true;
}

/**
 * Exchange callback auth code for tokens
 */
export async function exchangeCode(code: string, originalUrl: string) {
  const client = createOAuthClient();
  
  // createToken receives the full URL of the callback containing authorization query code
  const authResponse = await client.createToken(originalUrl);
  const tokenData = authResponse.getToken();

  const accessToken = tokenData.access_token;
  const refreshToken = tokenData.refresh_token;
  const expiresSec = tokenData.expires_in || 3600;
  const refreshExpiresSec = tokenData.x_refresh_token_expires_in || 8640000;

  if (!accessToken || !refreshToken) {
    throw new Error('QuickBooks OAuth code exchange failed: Access or Refresh token is empty.');
  }

  // Encrypt tokens before saving to database state
  const encryptedAccessToken = await credentialVault.encrypt(accessToken);
  const encryptedRefreshToken = await credentialVault.encrypt(refreshToken);

  const accessTokenExpiresAt = new Date(Date.now() + expiresSec * 1000).toISOString();
  const refreshTokenExpiresAt = new Date(Date.now() + refreshExpiresSec * 1000).toISOString();

  return {
    encryptedAccessToken,
    encryptedRefreshToken,
    accessTokenExpiresAt,
    refreshTokenExpiresAt
  };
}

/**
 * Return an OAuth client pre-authenticated and automatically refreshed if expired
 */
export async function getAuthenticatedClient(
  connection: QuickBooksConnection,
  dbState: any,
  saveDbStateCallback: () => Promise<void>
): Promise<OAuthClient> {
  const client = createOAuthClient();
  
  const isAccessTokenExpired = new Date(connection.accessTokenExpiresAt).getTime() - Date.now() < 5 * 60 * 1000; // under 5 minutes left
  
  // Decrypt tokens
  const decryptedAccessToken = await credentialVault.decrypt<string>(connection.encryptedAccessToken);
  const decryptedRefreshToken = await credentialVault.decrypt<string>(connection.encryptedRefreshToken);

  if (!isAccessTokenExpired) {
    client.setToken({
      access_token: decryptedAccessToken,
      refresh_token: decryptedRefreshToken,
      realmId: connection.realmId
    });
    return client;
  }

  // Token is expired. Refresh it.
  try {
    const authResponse = await client.refreshUsingToken(decryptedRefreshToken);
    const tokenData = authResponse.getToken();

    const newAccessToken = tokenData.access_token;
    const newRefreshToken = tokenData.refresh_token;
    const expiresSec = tokenData.expires_in || 3600;
    const refreshExpiresSec = tokenData.x_refresh_token_expires_in || 8640000;

    if (!newAccessToken || !newRefreshToken) {
      throw new Error('Refreshed token response lacks tokens.');
    }

    // Encrypt refreshed tokens
    const encryptedAccessToken = await credentialVault.encrypt(newAccessToken);
    const encryptedRefreshToken = await credentialVault.encrypt(newRefreshToken);

    connection.encryptedAccessToken = encryptedAccessToken;
    connection.encryptedRefreshToken = encryptedRefreshToken;
    connection.accessTokenExpiresAt = new Date(Date.now() + expiresSec * 1000).toISOString();
    connection.refreshTokenExpiresAt = new Date(Date.now() + refreshExpiresSec * 1000).toISOString();
    connection.status = 'connected';
    delete connection.lastError;

    // Log refresh audit
    const newAudit = {
      id: `audit_qb_refresh_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      workspaceId: connection.workspaceId,
      timestamp: new Date().toISOString(),
      user_name: 'System Scheduler',
      user_role: 'System',
      action_description: 'QuickBooks token refresh succeeded',
      impact_area: 'Integrations',
      impact_property: 'QuickBooks',
      rollback_available: false
    };
    dbState.auditEvents = [newAudit, ...dbState.auditEvents];

    await saveDbStateCallback();

    client.setToken({
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
      realmId: connection.realmId
    });
    return client;
  } catch (err: any) {
    console.error(`[QuickBooks OAuth] Token refresh failed for workspace ${connection.workspaceId}:`, err.message);
    
    // Mark connection as expired or error
    connection.status = 'expired';
    connection.lastError = err.message;

    // Log failure audit
    const newAudit = {
      id: `audit_qb_refresh_fail_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      workspaceId: connection.workspaceId,
      timestamp: new Date().toISOString(),
      user_name: 'System Scheduler',
      user_role: 'System',
      action_description: `QuickBooks token refresh failed: ${err.message}`,
      impact_area: 'Integrations',
      impact_property: 'QuickBooks',
      rollback_available: false
    };
    dbState.auditEvents = [newAudit, ...dbState.auditEvents];

    // Create Work Queue Exception Task
    const exceptionTask = {
      id: `work_item_qb_refresh_error_${connection.workspaceId}`,
      workspaceId: connection.workspaceId,
      title: 'QuickBooks Reconnection Required',
      description: `QuickBooks background token refresh failed. Integration is paused. Please disconnect and reconnect your QuickBooks Online account. (Error: ${err.message})`,
      status: 'pending',
      assignedStaffMemberId: 'unassigned',
      assignedOwnerRole: 'operations_lead',
      dueDate: 'SLA: 24 Hours',
      sourceSystem: 'quickbooks',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    if (!dbState.workItems) dbState.workItems = [];
    const exists = dbState.workItems.some((wi: any) => wi.id === exceptionTask.id);
    if (!exists) {
      dbState.workItems.push(exceptionTask);
    }

    await saveDbStateCallback();
    throw err;
  }
}
