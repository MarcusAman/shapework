/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MicrosoftConfig {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  redirectUri: string;
  graphBaseUrl: string;
}

export function getMicrosoftConfig(): MicrosoftConfig {
  const mode = process.env.APP_MODE || 'development';
  const clientId = process.env.MICROSOFT_CLIENT_ID || '';
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET || '';
  const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';
  const redirectUri = process.env.MICROSOFT_REDIRECT_URI || '';
  const graphBaseUrl = process.env.MICROSOFT_GRAPH_BASE_URL || 'https://graph.microsoft.com/v1.0';

  const isEnabled = !!clientId;

  if (isEnabled) {
    const missing: string[] = [];
    if (!clientSecret) missing.push('MICROSOFT_CLIENT_SECRET');
    if (!redirectUri) missing.push('MICROSOFT_REDIRECT_URI');

    if (missing.length > 0) {
      if (mode === 'production') {
        console.error('========================================================================');
        console.error(`FATAL ERROR: Microsoft 365 is configured but missing variables: ${missing.join(', ')}`);
        console.error('Production mode requires all Microsoft 365 parameters to be properly set.');
        console.error('========================================================================');
        process.exit(1);
      } else {
        console.warn(`[Microsoft Config] Warning: Microsoft 365 configured but missing: ${missing.join(', ')}`);
      }
    }
  }

  return {
    clientId,
    clientSecret,
    tenantId,
    redirectUri,
    graphBaseUrl
  };
}

export function isMicrosoftEnabled(): boolean {
  return !!process.env.MICROSOFT_CLIENT_ID;
}
