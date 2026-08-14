/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Licensed Contract Form Provider Factory — Phase 4A Architecture
 * Resolves the appropriate ILicensedContractFormProvider adapter based on environment configuration,
 * enforcing fail-closed protection in production.
 */

import { ILicensedContractFormProvider } from './licensedFormProviderInterface.js';
import { ContractFormsConfigService } from './contractFormsConfig.js';
import { UnconfiguredFormsProviderAdapter } from './unconfiguredFormsProviderAdapter.js';
import { DevelopmentFormsProviderAdapter } from './developmentFormsProviderAdapter.js';

export class LicensedFormProviderFactory {
  private static unconfiguredAdapter = new UnconfiguredFormsProviderAdapter();
  private static developmentAdapter = new DevelopmentFormsProviderAdapter();

  /**
   * Resolves the active ILicensedContractFormProvider for a workspace.
   */
  public static getProvider(workspaceId: string): ILicensedContractFormProvider {
    const config = ContractFormsConfigService.getFormsProviderConfig();
    const isProd = ContractFormsConfigService.isProductionEnvironment();

    if (isProd) {
      if (config.provider === 'mock_dev' || config.provider === 'unconfigured') {
        return this.unconfiguredAdapter;
      }

      if (config.provider === 'lone_wolf_transact') {
        if (!config.loneWolfClientId || !config.loneWolfClientSecret) {
          return this.unconfiguredAdapter;
        }
        // Future Phase: Return LoneWolfFormsProviderAdapter once provider integration agreement & credentials are supplied
        return this.unconfiguredAdapter;
      }

      return this.unconfiguredAdapter;
    }

    // Development Mode
    if (config.provider === 'unconfigured') {
      return this.unconfiguredAdapter;
    }

    return this.developmentAdapter;
  }
}
