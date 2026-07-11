/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface QuickBooksConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  environment: 'sandbox' | 'production';
  tokenEncryptionKey: string;
}

export function getQuickBooksConfig(): QuickBooksConfig {
  const mode = process.env.APP_MODE || 'development';
  const clientId = process.env.QUICKBOOKS_CLIENT_ID || '';
  const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET || '';
  const redirectUri = process.env.QUICKBOOKS_REDIRECT_URI || '';
  const environment = (process.env.QUICKBOOKS_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production';
  const tokenEncryptionKey = process.env.QUICKBOOKS_TOKEN_ENCRYPTION_KEY || process.env.CREDENTIAL_ENCRYPTION_KEY || 'dev_fallback_secret_key_placeholder';

  // Check if QuickBooks is enabled
  const isEnabled = !!clientId;

  if (isEnabled) {
    const missing: string[] = [];
    if (!clientSecret) missing.push('QUICKBOOKS_CLIENT_SECRET');
    if (!redirectUri) missing.push('QUICKBOOKS_REDIRECT_URI');
    
    if (missing.length > 0) {
      if (mode === 'production') {
        console.error('========================================================================');
        console.error(`FATAL ERROR: QuickBooks is enabled but missing configuration variables: ${missing.join(', ')}`);
        console.error('Production mode requires all QuickBooks parameters to be properly set.');
        console.error('========================================================================');
        process.exit(1);
      } else {
        console.warn(`[QuickBooks Config] Warning: QuickBooks is enabled but missing configuration variables: ${missing.join(', ')}`);
      }
    }
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
    environment,
    tokenEncryptionKey
  };
}

export function isQuickBooksEnabled(): boolean {
  return !!process.env.QUICKBOOKS_CLIENT_ID;
}
