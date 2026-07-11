/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { credentialVault } from '../../security/vault.js';

export async function encryptToken(token: string): Promise<string> {
  if (!token) return '';
  return await credentialVault.encrypt(token);
}

export async function decryptToken(encryptedRef: string): Promise<string> {
  if (!encryptedRef) return '';
  try {
    return await credentialVault.decrypt<string>(encryptedRef);
  } catch (e: any) {
    console.error('[Vault Helper] Decryption failed:', e.message);
    throw new Error('Credential decryption failed: ' + e.message);
  }
}
