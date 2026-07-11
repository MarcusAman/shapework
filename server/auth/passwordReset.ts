/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';
import pg from 'pg';
import { dbPool, storageDriver } from '../persistence/repositories.js';

export interface PasswordResetToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  usedAt?: string;
  createdAt: string;
  requestedIp?: string;
  userAgent?: string;
}

// In-memory store for local/memory drivers
const localResetTokens: PasswordResetToken[] = [];

/**
 * Hashes a raw reset token cryptographically.
 */
export function hashResetToken(token: string): string {
  const secret = process.env.PASSWORD_RESET_SECRET || 'dev_reset_pepper_default';
  return crypto
    .createHmac('sha256', secret)
    .update(token)
    .digest('hex');
}

/**
 * Creates and registers a new password reset token.
 * 
 * Returns the raw token string (unhashed) to be dispatched to the user.
 */
export async function createPasswordResetToken(
  userId: string,
  ip?: string,
  userAgent?: string
): Promise<string> {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashResetToken(rawToken);
  
  const id = `pr_${crypto.randomUUID()}`;
  const createdAt = new Date().toISOString();
  // 30 minute expiry
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  const tokenRecord: PasswordResetToken = {
    id,
    userId,
    tokenHash,
    expiresAt,
    createdAt,
    requestedIp: ip,
    userAgent
  };

  if (storageDriver === 'database' && dbPool) {
    try {
      await dbPool.query(
        `INSERT INTO password_reset_tokens 
         (id, user_id, token_hash, expires_at, requested_ip, user_agent, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id, userId, tokenHash, expiresAt, ip || null, userAgent || null, createdAt]
      );
      console.log(`[Auth] Registered secure password reset token in database for user ${userId}`);
    } catch (err) {
      console.error('[Auth] Failed to insert reset token in database:', err);
      throw err;
    }
  } else {
    localResetTokens.push(tokenRecord);
    console.log(`[Auth] Registered secure password reset token in memory for user ${userId}`);
  }

  return rawToken;
}

/**
 * Verifies the incoming raw token and consumes it (marking it used).
 * 
 * Returns the associated userId if valid, or null if invalid/expired.
 */
export async function verifyAndConsumePasswordResetToken(rawToken: string): Promise<string | null> {
  if (!rawToken || typeof rawToken !== 'string') {
    return null;
  }

  const tokenHash = hashResetToken(rawToken);
  const now = new Date();

  if (storageDriver === 'database' && dbPool) {
    try {
      const res = await dbPool.query(
        `SELECT * FROM password_reset_tokens 
         WHERE token_hash = $1 
           AND used_at IS NULL 
           AND expires_at > NOW()`,
        [tokenHash]
      );

      if (res.rows.length === 0) {
        console.warn('[Auth] Reset token search yielded no valid matches (expired, used, or non-existent)');
        return null;
      }

      const row = res.rows[0];
      
      // Consume the token atomically
      await dbPool.query(
        'UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1',
        [row.id]
      );
      
      console.log(`[Auth] Successfully verified and consumed reset token in database for user ${row.user_id}`);
      return row.user_id;
    } catch (err) {
      console.error('[Auth] Error querying/consuming password reset token:', err);
      return null;
    }
  } else {
    const tokenIndex = localResetTokens.findIndex(
      t => t.tokenHash === tokenHash && !t.usedAt && new Date(t.expiresAt) > now
    );

    if (tokenIndex === -1) {
      return null;
    }

    const token = localResetTokens[tokenIndex];
    token.usedAt = now.toISOString();

    console.log(`[Auth] Successfully verified and consumed reset token in memory for user ${token.userId}`);
    return token.userId;
  }
}
