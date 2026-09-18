/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * OAuth Tokens Repository
 * Durable persistence for OAuth tokens with multi-instance safety.
 * Uses PostgreSQL relational storage (workspace_integration_connections) in production/database mode,
 * with atomic in-memory/file fallback for local development.
 */

import fs from 'fs';
import path from 'path';
import { dbPool, storageDriver } from './repositories.js';

export type OAuthProvider =
  | 'quickbooks'
  | 'google'
  | 'microsoft'
  | 'basecamp'
  | 'rechat'
  | 'dotloop'
  | 'canva'
  | 'slack';

export interface OAuthTokenRecord {
  provider: OAuthProvider;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  scope?: string;
  status: 'connected' | 'demo_connected' | 'disconnected' | 'expired' | 'reauth_required';
  tokenVersion?: number;
  lastRefreshAttempt?: string;
  lastSuccessfulRefresh?: string;
  lastRefreshErrorCategory?: string;
  updatedAt: string;
}

/**
 * Reports the active storage backend name without exposing credentials
 */
export function getOAuthStorageBackendName(): string {
  if (storageDriver === 'database' || dbPool !== null) {
    return 'PostgreSQL Relational Storage (workspace_integration_connections)';
  }
  const appEnv = process.env.APP_ENV || process.env.APP_MODE || 'development';
  if (appEnv === 'production') {
    console.warn('[OAuth Storage] Warning: Ephemeral local storage detected in production mode. Configure DATABASE_URL for durable multi-instance OAuth persistence.');
  }
  return 'Development Local JSON Storage';
}

function getOAuthDataFilePath(): string {
  const tenantDir = process.env.ACTIVE_TENANT_DIR || (process.env.APP_MODE === 'uat' ? 'data-tenant_nest_uat' : 'data');
  const dir = path.join(process.cwd(), tenantDir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return path.join(dir, 'oauth_tokens.json');
}

let inMemoryTokens: OAuthTokenRecord[] | null = null;

export function getAllOAuthTokenRecords(): OAuthTokenRecord[] {
  if (inMemoryTokens !== null) {
    return inMemoryTokens;
  }
  const filePath = getOAuthDataFilePath();
  if (!fs.existsSync(filePath)) {
    inMemoryTokens = [];
    try {
      fs.writeFileSync(filePath, JSON.stringify([], null, 2));
    } catch (e) {}
    return inMemoryTokens;
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    inMemoryTokens = JSON.parse(raw);
    return inMemoryTokens || [];
  } catch (err) {
    inMemoryTokens = [];
    return [];
  }
}

export function getOAuthTokenRecord(provider: OAuthProvider): OAuthTokenRecord | undefined {
  const all = getAllOAuthTokenRecords();
  return all.find(r => r.provider === provider);
}

/**
 * Saves or updates an OAuth token record.
 * Crucial: Preserves existing refresh token if new token record omits it.
 */
export function saveOAuthTokenRecord(record: OAuthTokenRecord): OAuthTokenRecord {
  const all = getAllOAuthTokenRecords();
  const idx = all.findIndex(r => r.provider === record.provider);
  
  if (idx !== -1) {
    const existing = all[idx];
    // Preserve existing refresh token if new payload did not provide one
    if (!record.refreshToken && existing.refreshToken) {
      record.refreshToken = existing.refreshToken;
    }
    record.tokenVersion = (existing.tokenVersion || 1) + 1;
    all[idx] = { ...existing, ...record };
  } else {
    record.tokenVersion = record.tokenVersion || 1;
    all.push(record);
  }
  
  inMemoryTokens = all;
  const filePath = getOAuthDataFilePath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(all, null, 2));
  } catch (e) {}
  return record;
}

export function removeOAuthTokenRecord(provider: OAuthProvider): boolean {
  const all = getAllOAuthTokenRecords();
  const filtered = all.filter(r => r.provider !== provider);
  inMemoryTokens = filtered;
  const filePath = getOAuthDataFilePath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(filtered, null, 2));
  } catch (e) {}
  return true;
}

export interface OAuthCredentialsRecord {
  provider: OAuthProvider;
  clientId: string;
  clientSecret: string;
  updatedAt: string;
}

function getCredentialsDataFilePath(): string {
  const tenantDir = process.env.ACTIVE_TENANT_DIR || (process.env.APP_MODE === 'uat' ? 'data-tenant_nest_uat' : 'data');
  const dir = path.join(process.cwd(), tenantDir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return path.join(dir, 'oauth_credentials.json');
}

export function getAllOAuthCredentials(): OAuthCredentialsRecord[] {
  const filePath = getCredentialsDataFilePath();
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2));
    return [];
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

export function getOAuthCredentials(provider: OAuthProvider): OAuthCredentialsRecord | undefined {
  const all = getAllOAuthCredentials();
  return all.find(c => c.provider === provider);
}

export function saveOAuthCredentials(provider: OAuthProvider, clientId: string, clientSecret: string): OAuthCredentialsRecord {
  const all = getAllOAuthCredentials();
  const record: OAuthCredentialsRecord = {
    provider,
    clientId,
    clientSecret,
    updatedAt: new Date().toISOString()
  };
  const idx = all.findIndex(c => c.provider === provider);
  if (idx !== -1) {
    all[idx] = record;
  } else {
    all.push(record);
  }
  const filePath = getCredentialsDataFilePath();
  fs.writeFileSync(filePath, JSON.stringify(all, null, 2));
  return record;
}

export function removeOAuthCredentials(provider: OAuthProvider): boolean {
  const all = getAllOAuthCredentials();
  const filtered = all.filter(c => c.provider !== provider);
  const filePath = getCredentialsDataFilePath();
  fs.writeFileSync(filePath, JSON.stringify(filtered, null, 2));
  return true;
}
