/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as crypto from 'crypto';

export type IntegrationConnection = {
  id: string;
  workspaceId: string;
  provider:
    | "rechat"
    | "apination_dotloop"
    | "gmail"
    | "outlook"
    | "twilio"
    | "google_drive"
    | "microsoft_365";
  status:
    | "not_connected"
    | "connected"
    | "error"
    | "revoked"
    | "needs_reauth";
  authType: "oauth" | "api_key" | "webhook_secret";
  scopes: string[];
  encryptedCredentialRef: string;
  lastSyncAt?: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
};

export interface CredentialVault {
  encrypt(value: unknown): Promise<string>;
  decrypt<T>(ref: string): Promise<T>;
  rotate(ref: string, newValue: unknown): Promise<string>;
  revoke(ref: string): Promise<void>;
}

class AesGcmCredentialVault implements CredentialVault {
  private encryptionKey: string;
  private isDevFallback = false;

  constructor() {
    const key = process.env.CREDENTIAL_ENCRYPTION_KEY;
    const mode = process.env.APP_MODE || 'development';

    if (!key || key.length < 32) {
      if (mode === 'production') {
        console.error('========================================================================');
        console.error('FATAL ERROR: CREDENTIAL_ENCRYPTION_KEY is NOT set or is less than 32 characters long!');
        console.error('Production mode requires a secure encryption key of at least 32 characters.');
        console.error('========================================================================');
        process.exit(1);
      } else {
        console.warn('[Security Vault] CREDENTIAL_ENCRYPTION_KEY is unconfigured or less than 32 characters. Falling back to local Base64 dev encoder.');
        this.isDevFallback = true;
        this.encryptionKey = key || 'dev_fallback_secret_key_placeholder';
      }
    } else {
      this.encryptionKey = key;
    }
  }

  private getKeyBuffer(): Buffer {
    // Derive a secure 32-byte key from the configured password string
    return crypto.scryptSync(this.encryptionKey, 'shapework_salt_123', 32);
  }

  public async encrypt(value: unknown): Promise<string> {
    const serialized = JSON.stringify(value);

    if (this.isDevFallback) {
      const base64 = Buffer.from(serialized, 'utf8').toString('base64');
      return `dev_plain:${base64}`;
    }

    try {
      const keyBuffer = this.getKeyBuffer();
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);
      
      let encrypted = cipher.update(serialized, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag().toString('hex');
      
      return `ref_v1:${iv.toString('hex')}:${tag}:${encrypted}`;
    } catch (e: any) {
      console.error('[Security Vault] Encryption failed:', e.message);
      throw new Error('Credential encryption failure: ' + e.message);
    }
  }

  public async decrypt<T>(ref: string): Promise<T> {
    if (!ref) {
      throw new Error('Null or empty credential reference.');
    }

    if (ref.startsWith('dev_plain:')) {
      const base64 = ref.split(':')[1];
      const decoded = Buffer.from(base64, 'base64').toString('utf8');
      return JSON.parse(decoded) as T;
    }

    if (!ref.startsWith('ref_v1:')) {
      throw new Error('Unknown or unsupported credential reference prefix: ' + ref);
    }

    try {
      const [, ivHex, tagHex, encryptedHex] = ref.split(':');
      const keyBuffer = this.getKeyBuffer();
      const iv = Buffer.from(ivHex, 'hex');
      const tag = Buffer.from(tagHex, 'hex');
      
      const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted) as T;
    } catch (e: any) {
      console.error('[Security Vault] Decryption failed:', e.message);
      throw new Error('Credential decryption failure: ' + e.message);
    }
  }

  public async rotate(ref: string, newValue: unknown): Promise<string> {
    // Revoke old ref and generate new encrypted envelope reference
    await this.revoke(ref);
    return this.encrypt(newValue);
  }

  public async revoke(ref: string): Promise<void> {
    // Zero-out or discard parameters if referencing external state store
    // (Local mock discard completes synchronously)
  }
}

export const credentialVault = new AesGcmCredentialVault();
export type { CredentialVault as ICredentialVault };
