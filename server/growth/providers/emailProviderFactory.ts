/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EmailProvider } from './EmailProvider.js';
import { ResendProvider } from './ResendProvider.js';

export function getProviderMode(): 'demo' | 'test' | 'production' {
  const envMode = process.env.GROWTH_EMAIL_PROVIDER_MODE;
  if (envMode === 'production' || envMode === 'demo' || envMode === 'test') {
    return envMode;
  }
  const appMode = process.env.APP_MODE || process.env.NODE_ENV;
  if (appMode === 'production') {
    return 'production';
  }
  if (appMode === 'test' || process.env.JWT_SECRET === 'mock_jwt_secret_for_growth_testing') {
    return 'test';
  }
  return 'demo';
}

export function getEmailProvider(): EmailProvider {
  const mode = getProviderMode();
  let apiKey = process.env.RESEND_API_KEY || null;
  if (mode === 'demo') {
    // Demo mode must never use real Resend credentials
    apiKey = null;
  }
  return new ResendProvider(apiKey, mode);
}
