/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Contract Forms Provider Configuration & Fail-Closed Guard — Phase 4A Architecture
 * Inspects environment settings and enforces production fail-closed rules.
 */

export type SupportedFormsProvider = 'lone_wolf_transact' | 'zipform_edition' | 'mock_dev' | 'unconfigured';

export interface FormsProviderConfig {
  provider: SupportedFormsProvider;
  loneWolfClientId?: string;
  loneWolfClientSecret?: string;
  loneWolfEnvironment?: 'sandbox' | 'production';
  loneWolfAccountId?: string;
  zipFormPartnerApiKey?: string;
  appMode: string;
  nodeEnv: string;
  storageDriver: string;
}

export class ContractFormsConfigService {
  
  public static getFormsProviderConfig(): FormsProviderConfig {
    const providerRaw = (process.env.FORMS_PROVIDER || 'unconfigured').toLowerCase();
    let provider: SupportedFormsProvider = 'unconfigured';

    if (['lone_wolf_transact', 'lonewolf', 'lone_wolf'].includes(providerRaw)) {
      provider = 'lone_wolf_transact';
    } else if (['zipform_edition', 'zipform'].includes(providerRaw)) {
      provider = 'zipform_edition';
    } else if (['mock_dev', 'mock', 'development'].includes(providerRaw)) {
      provider = 'mock_dev';
    }

    return {
      provider,
      loneWolfClientId: process.env.LONE_WOLF_CLIENT_ID,
      loneWolfClientSecret: process.env.LONE_WOLF_CLIENT_SECRET,
      loneWolfEnvironment: (process.env.LONE_WOLF_ENVIRONMENT as any) || 'sandbox',
      loneWolfAccountId: process.env.LONE_WOLF_ACCOUNT_ID,
      zipFormPartnerApiKey: process.env.ZIPFORM_PARTNER_API_KEY,
      appMode: process.env.APP_MODE || 'development',
      nodeEnv: process.env.NODE_ENV || 'development',
      storageDriver: process.env.STORAGE_DRIVER || 'memory'
    };
  }

  public static isProductionEnvironment(): boolean {
    const appMode = (process.env.APP_MODE || '').toLowerCase();
    const nodeEnv = (process.env.NODE_ENV || '').toLowerCase();
    return appMode === 'production' || nodeEnv === 'production';
  }

  /**
   * Asserts that an authorized licensed forms provider is configured in production.
   * Fails closed with LICENSED_FORMS_PROVIDER_NOT_CONFIGURED if unconfigured or attempting to use development mock in production.
   */
  public static assertLicensedFormsProviderConfigured(workspaceId: string): void {
    const config = this.getFormsProviderConfig();
    const isProd = this.isProductionEnvironment();

    if (isProd) {
      if (config.provider === 'mock_dev' || config.provider === 'unconfigured') {
        throw new Error(`LICENSED_FORMS_PROVIDER_NOT_CONFIGURED: No licensed forms provider (e.g. Lone Wolf Transactions / zipForm Edition) is configured for workspace '${workspaceId}'. Production contract draft generation cannot proceed without an authorized, licensed forms provider integration.`);
      }

      if (config.provider === 'lone_wolf_transact' && (!config.loneWolfClientId || !config.loneWolfClientSecret)) {
        throw new Error(`LICENSED_FORMS_PROVIDER_NOT_CONFIGURED: Lone Wolf Transactions provider selected but missing required client credentials (LONE_WOLF_CLIENT_ID / LONE_WOLF_CLIENT_SECRET).`);
      }
    } else {
      // In development mode, if unconfigured, default to mock_dev
      if (config.provider === 'unconfigured') {
        // Safe development fallback
        return;
      }
    }
  }
}
