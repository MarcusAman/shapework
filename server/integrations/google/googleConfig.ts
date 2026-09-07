/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GoogleConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopesProfile: string;
  appBaseUrl: string;
  serviceAccountEmail?: string;
  serviceAccountPrivateKey?: string;
  serviceAccountClientId?: string;
  serviceAccountProjectId?: string;
  workspaceSubject?: string;
}

export function getGoogleConfig(): GoogleConfig {
  const mode = process.env.APP_MODE || 'development';
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || '';
  const scopesProfile = process.env.GOOGLE_OAUTH_SCOPES_PROFILE || 'email profile openid';
  const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';

  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
  let serviceAccountPrivateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '';
  if (serviceAccountPrivateKey && serviceAccountPrivateKey.includes('\\n')) {
    serviceAccountPrivateKey = serviceAccountPrivateKey.replace(/\\n/g, '\n');
  }
  const serviceAccountClientId = process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_ID || '';
  const serviceAccountProjectId = process.env.GOOGLE_SERVICE_ACCOUNT_PROJECT_ID || '';
  const workspaceSubject = process.env.GOOGLE_WORKSPACE_SUBJECT || process.env.ASK_NORA_WORKSPACE_EMAIL || 'AskNora@nestrealty.com';

  const isEnabled = !!clientId || !!serviceAccountEmail;

  if (isEnabled && !serviceAccountEmail) {
    const missing: string[] = [];
    if (!clientSecret) missing.push('GOOGLE_CLIENT_SECRET');
    if (!redirectUri) missing.push('GOOGLE_REDIRECT_URI');

    if (missing.length > 0) {
      if (mode === 'production') {
        console.error('========================================================================');
        console.error(`FATAL ERROR: Google Workspace is configured but missing variables: ${missing.join(', ')}`);
        console.error('Production mode requires all Google OAuth parameters to be properly set.');
        console.error('========================================================================');
        process.exit(1);
      } else {
        console.warn(`[Google Config] Warning: Google Workspace configured but missing: ${missing.join(', ')}`);
      }
    }
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
    scopesProfile,
    appBaseUrl,
    serviceAccountEmail,
    serviceAccountPrivateKey,
    serviceAccountClientId,
    serviceAccountProjectId,
    workspaceSubject
  };
}

export function isGoogleServiceAccountConfigured(): boolean {
  const cfg = getGoogleConfig();
  return !!(cfg.serviceAccountEmail && cfg.serviceAccountPrivateKey);
}

export function isGoogleEnabled(): boolean {
  return !!process.env.GOOGLE_CLIENT_ID || isGoogleServiceAccountConfigured();
}

