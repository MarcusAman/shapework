/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BasecampConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  baseUrl: string;
  userAgent: string;
  tokenEncryptionKey: string;
  syncLookbackDays: number;
}

export function getBasecampConfig(): BasecampConfig {
  const mode = process.env.APP_MODE || 'development';
  const clientId = process.env.BASECAMP_CLIENT_ID || '';
  const clientSecret = process.env.BASECAMP_CLIENT_SECRET || '';
  const redirectUri = process.env.BASECAMP_REDIRECT_URI || '';
  const baseUrl = process.env.BASECAMP_BASE_URL || 'https://3.basecampapi.com';
  const userAgent = process.env.BASECAMP_USER_AGENT || 'shapework (support@shapework.ai)';
  const tokenEncryptionKey = process.env.BASECAMP_TOKEN_ENCRYPTION_KEY || process.env.CREDENTIAL_ENCRYPTION_KEY || 'dev_fallback_secret_key_placeholder';
  const syncLookbackDays = parseInt(process.env.BASECAMP_SYNC_LOOKBACK_DAYS || '30', 10);

  // Check if Basecamp is enabled
  const isEnabled = !!clientId;

  if (isEnabled) {
    const missing: string[] = [];
    if (!clientSecret) missing.push('BASECAMP_CLIENT_SECRET');
    if (!redirectUri) missing.push('BASECAMP_REDIRECT_URI');

    if (missing.length > 0) {
      if (mode === 'production') {
        console.error('========================================================================');
        console.error(`FATAL ERROR: Basecamp is enabled but missing configuration variables: ${missing.join(', ')}`);
        console.error('Production mode requires all Basecamp parameters to be properly set.');
        console.error('========================================================================');
        process.exit(1);
      } else {
        console.warn(`[Basecamp Config] Warning: Basecamp is enabled but missing configuration variables: ${missing.join(', ')}`);
      }
    }
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
    baseUrl,
    userAgent,
    tokenEncryptionKey,
    syncLookbackDays
  };
}

export function isBasecampEnabled(): boolean {
  return !!process.env.BASECAMP_CLIENT_ID;
}
