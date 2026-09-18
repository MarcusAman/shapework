/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';
import pg from 'pg';
import { dbPool, storageDriver } from '../persistence/repositories.js';

import fs from 'fs';
import path from 'path';

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

const PERSISTENCE_DIR = path.join(process.cwd(), 'data');
const PERSISTENCE_FILE = path.join(PERSISTENCE_DIR, 'reset_tokens.json');

function loadPersistentTokens(): PasswordResetToken[] {
  try {
    if (fs.existsSync(PERSISTENCE_FILE)) {
      const content = fs.readFileSync(PERSISTENCE_FILE, 'utf-8');
      const data = JSON.parse(content);
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    // Ignore read errors
  }
  return [];
}

function savePersistentTokens(tokens: PasswordResetToken[]): void {
  try {
    if (!fs.existsSync(PERSISTENCE_DIR)) {
      fs.mkdirSync(PERSISTENCE_DIR, { recursive: true });
    }
    fs.writeFileSync(PERSISTENCE_FILE, JSON.stringify(tokens, null, 2), 'utf-8');
  } catch (err) {
    // Ignore write errors
  }
}

// In-memory store for local/memory drivers, initialized from persistent storage or global
if (!(global as any).__SHAPEWORK_LOCAL_RESET_TOKENS) {
  (global as any).__SHAPEWORK_LOCAL_RESET_TOKENS = loadPersistentTokens();
}
const localResetTokens: PasswordResetToken[] = (global as any).__SHAPEWORK_LOCAL_RESET_TOKENS;

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

// Ensure pre-seeded token for Marty Supreme (marcus.aman@gmail.com) is valid
const seedRawToken = '3bc2369adcfc00d335484278da8b859e4298549f8e9fafd74f85772995df5477';
const seedHash = hashResetToken(seedRawToken);
if (!localResetTokens.some(t => t.tokenHash === seedHash)) {
  localResetTokens.push({
    id: 'pr_seed_marcus_aman',
    userId: 'marcus.aman@gmail.com',
    tokenHash: seedHash,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    requestedIp: 'bootstrap'
  });
  savePersistentTokens(localResetTokens);
}

/**
 * Creates and registers a new password reset or setup token.
 * 
 * Returns the raw token string (unhashed) to be dispatched to the user.
 */
export async function createPasswordResetToken(
  userId: string,
  ip?: string,
  userAgent?: string,
  durationMs: number = 30 * 60 * 1000
): Promise<string> {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashResetToken(rawToken);
  
  const id = `pr_${crypto.randomUUID()}`;
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + durationMs).toISOString();

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
    const maxRetries = 3;
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        await dbPool.query(
          `INSERT INTO password_reset_tokens 
           (id, user_id, token_hash, expires_at, requested_ip, user_agent, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [id, userId, tokenHash, expiresAt, ip || null, userAgent || null, createdAt]
        );
        console.log(`[Auth] Registered secure password reset token in database for user ${userId}`);
        break;
      } catch (err: any) {
        if (err && err.code === '40P01' && attempt < maxRetries - 1) {
          attempt++;
          console.warn(`[Auth] Deadlock detected on password_reset_tokens insert, retrying (${attempt}/${maxRetries})...`);
          await new Promise(res => setTimeout(res, 50 * attempt));
          continue;
        }
        console.error('[Auth] Failed to insert reset token in database:', err);
        throw err;
      }
    }
  } else {
    localResetTokens.push(tokenRecord);
    savePersistentTokens(localResetTokens);
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
      
      // Consume the token atomically with deadlock retry
      const maxRetries = 3;
      let updateAttempt = 0;
      while (updateAttempt < maxRetries) {
        try {
          await dbPool.query(
            'UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1',
            [row.id]
          );
          break;
        } catch (updateErr: any) {
          if (updateErr && updateErr.code === '40P01' && updateAttempt < maxRetries - 1) {
            updateAttempt++;
            console.warn(`[Auth] Deadlock detected on password_reset_tokens update, retrying (${updateAttempt}/${maxRetries})...`);
            await new Promise(res => setTimeout(res, 50 * updateAttempt));
            continue;
          }
          throw updateErr;
        }
      }
      
      console.log(`[Auth] Successfully verified and consumed reset token in database for user ${row.user_id}`);
      return row.user_id;
    } catch (err) {
      console.error('[Auth] Error querying/consuming password reset token:', err);
      return null;
    }
  } else {
    let tokenIndex = localResetTokens.findIndex(
      t => t.tokenHash === tokenHash && !t.usedAt && new Date(t.expiresAt) > now
    );

    if (tokenIndex === -1) {
      const diskTokens = loadPersistentTokens();
      for (const dt of diskTokens) {
        if (!localResetTokens.some(lt => lt.id === dt.id)) {
          localResetTokens.push(dt);
        }
      }
      tokenIndex = localResetTokens.findIndex(
        t => t.tokenHash === tokenHash && !t.usedAt && new Date(t.expiresAt) > now
      );
    }

    if (tokenIndex === -1) {
      return null;
    }

    const token = localResetTokens[tokenIndex];
    token.usedAt = now.toISOString();
    savePersistentTokens(localResetTokens);

    console.log(`[Auth] Successfully verified and consumed reset token in memory for user ${token.userId}`);
    return token.userId;
  }
}

/**
 * Generates a 7-day password setup token for onboarding.
 */
export async function createAccountSetupToken(
  userId: string,
  durationMs: number = 7 * 24 * 60 * 60 * 1000
): Promise<string> {
  return createPasswordResetToken(userId, 'onboarding_system', 'shapework_onboarding', durationMs);
}

export interface TeamMemberSetupLink {
  name: string;
  email: string;
  role: string;
  token: string;
  setupUrl: string;
  expiresIn: string;
}

export const PILOT_TEAM_SETUP_ROSTER = [
  { name: 'Ryan Crecelius', email: 'ryan@nestrealty.com', id: 'usr_ryan', role: 'Owner / Principal Broker' },
  { name: 'Melissa Gagliardi', email: 'mg@nestrealty.com', id: 'usr_melissa_mg', role: 'Marketing Director' },
  { name: 'Ann Gunn', email: 'ann@nestrealty.com', id: 'usr_ann', role: 'Operations Director' },
  { name: 'James Fort', email: 'james@nestrealty.com', id: 'usr_james', role: 'CFO / Transaction Lead' },
  { name: 'Eric Knight', email: 'eric@nestrealty.com', id: 'usr_eric', role: 'Broker-in-Charge' },
  { name: 'Jessica Keenan', email: 'jessica.keenan@nestrealty.com', id: 'usr_jessica', role: 'Broker-in-Charge' },
  { name: 'Eduardo Lovo', email: 'eduardo.lovo@nestrealty.com', id: 'usr_eduardo', role: 'Virtual Assistant' }
];

/**
 * Generates active password setup links for all 7 team members.
 */
export async function generateTeamSetupLinks(baseUrl: string = 'https://shapework.co'): Promise<TeamMemberSetupLink[]> {
  const cleanBase = baseUrl.replace(/\/$/, '');
  const links: TeamMemberSetupLink[] = [];

  for (const member of PILOT_TEAM_SETUP_ROSTER) {
    const rawToken = await createAccountSetupToken(member.id, 7 * 24 * 60 * 60 * 1000);
    links.push({
      name: member.name,
      email: member.email,
      role: member.role,
      token: rawToken,
      setupUrl: `${cleanBase}/reset-password?token=${rawToken}&setup=true&email=${encodeURIComponent(member.email)}`,
      expiresIn: '7 days'
    });
  }

  return links;
}

