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
}

export function getGoogleConfig(): GoogleConfig {
  const mode = process.env.APP_MODE || 'development';
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || '';
  const scopesProfile = process.env.GOOGLE_OAUTH_SCOPES_PROFILE || 'email profile openid';
  const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';

  const isEnabled = !!clientId;

  if (isEnabled) {
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
    appBaseUrl
  };
}

export function isGoogleEnabled(): boolean {
  return !!process.env.GOOGLE_CLIENT_ID;
}
