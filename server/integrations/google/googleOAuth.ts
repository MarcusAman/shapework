/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';
import { google } from 'googleapis';
import { getGoogleConfig } from './googleConfig.js';
import { encryptToken, decryptToken } from '../shared/integrationCredentialVault.js';
import { logIntegrationAudit } from '../shared/integrationAudit.js';
import { WorkspaceIntegrationConnection } from '../shared/integrationTypes.js';

export interface OAuthStateData {
  workspaceId: string;
  userId: string;
  expiresAt: number;
  nonce: string;
}

export const googleActiveStates = new Map<string, OAuthStateData>();

export function generateGoogleOAuthState(workspaceId: string, userId: string): string {
  const nonce = crypto.randomBytes(16).toString('hex');
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  const stateToken = crypto.randomBytes(32).toString('hex');

  googleActiveStates.set(stateToken, {
    workspaceId,
    userId,
    expiresAt,
    nonce
  });

  return stateToken;
}

export function validateGoogleOAuthState(stateToken: string, workspaceId: string, userId: string): boolean {
  const stateData = googleActiveStates.get(stateToken);
  if (!stateData) return false;
  if (stateData.workspaceId !== workspaceId || stateData.userId !== userId) return false;
  if (Date.now() > stateData.expiresAt) return false;

  googleActiveStates.delete(stateToken);
  return true;
}

export function getOAuthClient() {
  const config = getGoogleConfig();
  return new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    config.redirectUri
  );
}

export async function exchangeGoogleCode(code: string) {
  const isProd = process.env.APP_MODE === 'production' || process.env.NODE_ENV === 'production';
  const isMock = !isProd && (process.env.APP_MODE === 'development' || !process.env.GOOGLE_CLIENT_ID);
  if (isMock) {
    return {
      email: 'mock.user@gmail.com',
      providerAccountId: 'mock_google_id_123',
      encryptedAccessToken: await encryptToken('mock_google_access_token_123'),
      encryptedRefreshToken: await encryptToken('mock_google_refresh_token_123'),
      accessTokenExpiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      scopes: ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/calendar.readonly']
    };
  }

  const oauth2Client = getOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  // Get user profile email
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const userInfo = await oauth2.userinfo.get();
  const email = userInfo.data.email || '';
  const providerAccountId = userInfo.data.id || '';

  const encryptedAccessToken = await encryptToken(tokens.access_token || '');
  const encryptedRefreshToken = tokens.refresh_token ? await encryptToken(tokens.refresh_token) : undefined;
  const accessTokenExpiresAt = tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : '';

  return {
    email,
    providerAccountId,
    encryptedAccessToken,
    encryptedRefreshToken,
    accessTokenExpiresAt,
    scopes: tokens.scope ? tokens.scope.split(' ') : []
  };
}

export async function getGoogleAccessToken(
  connection: WorkspaceIntegrationConnection,
  dbState: any,
  saveStateCallback: () => Promise<void>
): Promise<string> {
  const currentAccessToken = await decryptToken(connection.encryptedAccessToken);

  // If token is valid (with 5-minute safety margin), use it
  if (connection.accessTokenExpiresAt) {
    const expiresTime = new Date(connection.accessTokenExpiresAt).getTime();
    if (Date.now() < expiresTime - 5 * 60 * 1000) {
      return currentAccessToken;
    }
  }

  // Token is expired; we must refresh it
  if (!connection.encryptedRefreshToken) {
    throw new Error('Google refresh token is missing. Please re-authenticate.');
  }

  console.log(`[Google OAuth] Refreshing expired access token for workspace: ${connection.workspaceId}`);
  const decryptedRefresh = await decryptToken(connection.encryptedRefreshToken);

  try {
    const oauth2Client = getOAuthClient();
    oauth2Client.setCredentials({
      refresh_token: decryptedRefresh
    });

    const { credentials } = await oauth2Client.refreshAccessToken();
    const newAccessToken = credentials.access_token || '';
    const newExpiresAt = credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : new Date(Date.now() + 3600 * 1000).toISOString();

    const encAccess = await encryptToken(newAccessToken);
    connection.encryptedAccessToken = encAccess;
    connection.accessTokenExpiresAt = newExpiresAt;
    connection.status = 'connected';
    delete connection.lastError;

    logIntegrationAudit(
      dbState,
      connection.workspaceId,
      'System Scheduler',
      'System',
      'Google OAuth token refresh succeeded',
      'Google Workspace'
    );

    await saveStateCallback();
    return newAccessToken;
  } catch (err: any) {
    console.error(`[Google OAuth] Token refresh failed for workspace ${connection.workspaceId}:`, err.message);

    connection.status = 'expired';
    connection.lastError = `Token refresh failed: ${err.message}`;

    logIntegrationAudit(
      dbState,
      connection.workspaceId,
      'System Scheduler',
      'System',
      `Google OAuth token refresh failed: ${err.message}`,
      'Google Workspace'
    );

    await saveStateCallback();
    throw err;
  }
}
