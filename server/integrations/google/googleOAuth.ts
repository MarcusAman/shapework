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

export function getOAuthClient(req?: any) {
  const config = getGoogleConfig();
  let redirectUri = config.redirectUri;
  if (!redirectUri && req) {
    redirectUri = `${req.protocol}://${req.get('host')}/api/integrations/google/callback`;
  }
  if (!redirectUri) {
    redirectUri = process.env.PUBLIC_APP_BASE_URL 
      ? `${process.env.PUBLIC_APP_BASE_URL}/api/integrations/google/callback` 
      : 'http://localhost:3049/api/integrations/google/callback';
  }
  return new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    redirectUri
  );
}

export function getGoogleServiceAccountJWTClient(
  subject?: string,
  scopes: string[] = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/drive'
  ]
) {
  const config = getGoogleConfig();
  if (!config.serviceAccountEmail || !config.serviceAccountPrivateKey) {
    return null;
  }

  const targetSubject = subject || config.workspaceSubject || 'AskNora@nestrealty.com';

  return new google.auth.JWT({
    email: config.serviceAccountEmail,
    key: config.serviceAccountPrivateKey,
    scopes,
    subject: targetSubject
  });
}

export async function exchangeGoogleCode(code: string, req?: any) {
  const config = getGoogleConfig();
  const hasRealCredentials = !!(config.clientId && config.clientSecret && !config.clientId.includes('placeholder') && !config.clientId.includes('mock'));
  const isMockCode = code.startsWith('mock_');

  if (!hasRealCredentials || isMockCode) {
    return {
      email: 'operations@nestrealty.com',
      providerAccountId: 'google_nest_ops_001',
      encryptedAccessToken: await encryptToken('mock_google_access_token_nest_ops'),
      encryptedRefreshToken: await encryptToken('mock_google_refresh_token_nest_ops'),
      accessTokenExpiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      scopes: ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/calendar.readonly', 'https://www.googleapis.com/auth/drive.readonly']
    };
  }

  const oauth2Client = getOAuthClient(req);
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

export const GOOGLE_CALENDAR_SCOPES = [
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/calendar.calendarlist.readonly',
  'https://www.googleapis.com/auth/calendar.events.freebusy',
  'https://www.googleapis.com/auth/calendar.events'
];

export const GOOGLE_WORKSPACE_SCOPES = [
  'openid',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/presentations',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/chat.spaces',
  'https://www.googleapis.com/auth/chat.messages'
];

export async function verifyGoogleConnection(
  connection: WorkspaceIntegrationConnection,
  dbState: any,
  saveStateCallback: () => Promise<void>
): Promise<{ 
  verified: boolean; 
  email?: string; 
  error?: string;
  capabilities: { gmail: boolean; calendar: boolean; drive: boolean };
  missingPermissions: string[];
}> {
  const isProd = process.env.APP_MODE === 'production' || process.env.NODE_ENV === 'production';
  const isMock = !isProd && (process.env.APP_MODE === 'development' || !process.env.GOOGLE_CLIENT_ID);

  const defaultCaps = { gmail: false, calendar: false, drive: false };

  if (isMock) {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return { 
        verified: false, 
        error: 'Unconfigured OAuth credentials: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be configured in environment variables to authorize Google Workspace.',
        capabilities: defaultCaps,
        missingPermissions: GOOGLE_CALENDAR_SCOPES
      };
    }
  }

  try {
    const accessToken = await getGoogleAccessToken(connection, dbState, saveStateCallback);

    const oauth2Client = getOAuthClient();
    oauth2Client.setCredentials({
      access_token: accessToken
    });
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    if (!userInfo.data || !userInfo.data.email) {
      return { 
        verified: false, 
        error: 'Google API UserInfo call succeeded but did not return email.',
        capabilities: defaultCaps,
        missingPermissions: GOOGLE_CALENDAR_SCOPES
      };
    }

    const email = userInfo.data.email;
    const grantedScopes = connection.scopes || [];

    const hasGmail = grantedScopes.some(s => s === 'https://www.googleapis.com/auth/gmail.send' || s === 'https://mail.google.com/');
    const hasCalendar = grantedScopes.some(s => s === 'https://www.googleapis.com/auth/calendar.events' || s === 'https://www.googleapis.com/auth/calendar' || s === 'https://www.googleapis.com/auth/calendar.events.owned');
    const hasDrive = grantedScopes.some(s => s === 'https://www.googleapis.com/auth/drive.readonly' || s === 'https://www.googleapis.com/auth/drive.metadata.readonly' || s === 'https://www.googleapis.com/auth/drive');

    const capabilities = {
      gmail: hasGmail,
      calendar: hasCalendar,
      drive: hasDrive
    };

    const missingPermissions: string[] = [];
    if (!hasGmail) missingPermissions.push('gmail');
    if (!hasCalendar) missingPermissions.push('calendar');
    if (!hasDrive) missingPermissions.push('drive');

    return {
      verified: true,
      email,
      capabilities,
      missingPermissions
    };
  } catch (err: any) {
    console.error('[Google OAuth Verification] Verification failed:', err.message);
    return { 
      verified: false, 
      error: `Google API verification failed: ${err.message}`,
      capabilities: defaultCaps,
      missingPermissions: GOOGLE_WORKSPACE_SCOPES
    };
  }
}
