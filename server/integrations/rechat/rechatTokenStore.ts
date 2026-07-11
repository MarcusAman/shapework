/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { credentialVault } from '../../security/vault';

export interface RechatTokenData {
  accessToken: string;
  refreshToken: string;
  brandId: string;
  expiresAt?: number; // timestamp in ms
}

/**
 * PRODUCTION HARDENED:
 * This token store wraps credentials with AES-256-GCM encryption before storing them,
 * preventing credentials exposure in heap dumps or session states.
 */
class RechatTokenStore {
  private store = new Map<string, { encryptedRef: string }>();

  public async saveTokens(connectionId: string, data: RechatTokenData): Promise<void> {
    try {
      const encryptedRef = await credentialVault.encrypt(data);
      this.store.set(connectionId, { encryptedRef });
    } catch (e: any) {
      console.error('[Rechat Token Store] Failed to encrypt tokens during save:', e.message);
      throw e;
    }
  }

  public async getTokens(connectionId: string): Promise<RechatTokenData | undefined> {
    const wrapper = this.store.get(connectionId);
    if (!wrapper) return undefined;
    
    try {
      return await credentialVault.decrypt<RechatTokenData>(wrapper.encryptedRef);
    } catch (e: any) {
      console.error('[Rechat Token Store] Failed to decrypt tokens:', e.message);
      return undefined;
    }
  }

  public clearTokens(connectionId: string): void {
    this.store.delete(connectionId);
  }

  public isConnected(connectionId: string): boolean {
    return this.store.has(connectionId);
  }
}

export const tokenStore = new RechatTokenStore();
