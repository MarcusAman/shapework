/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

// Target Work Factor: 250,000 iterations of PBKDF2-HMAC-SHA512 (exceeds OWASP 2024 minimum of 210,000)
export const CURRENT_PBKDF2_ITERATIONS = 250000;
export const LEGACY_PBKDF2_ITERATIONS = 100000;
export const KEY_LEN = 64;
export const DIGEST = 'sha512';
export const HASH_VERSION_PREFIX = '$pbkdf2-sha512$i=250000$l=64$';

/**
 * Hash password using versioned PBKDF2-HMAC-SHA512 with 250,000 iterations and 32-byte cryptographically secure salt.
 */
export function hashPassword(password: string): string {
  if (typeof password !== 'string' || password.length > 4096) {
    throw new Error('Password length exceeds maximum allowed limit (4096 bytes).');
  }
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, CURRENT_PBKDF2_ITERATIONS, KEY_LEN, DIGEST).toString('hex');
  return `${HASH_VERSION_PREFIX}${salt}$${hash}`;
}

export interface VerifyPasswordResult {
  valid: boolean;
  needsRehash: boolean;
}

/**
 * Verify password against stored hash with timing-safe comparison.
 * Supports both modern versioned format ($pbkdf2-sha512$i=250000$l=64$salt$hash) and legacy format (salt:hash).
 */
export function verifyPassword(password: string, storedHash?: string | null): boolean {
  return verifyPasswordWithRehashCheck(password, storedHash).valid;
}

export function verifyPasswordWithRehashCheck(password: string, storedHash?: string | null): VerifyPasswordResult {
  if (!storedHash || typeof storedHash !== 'string' || typeof password !== 'string') {
    return { valid: false, needsRehash: false };
  }
  if (password.length > 4096) {
    return { valid: false, needsRehash: false };
  }

  try {
    // 1. Check for Modern Versioned Format
    if (storedHash.startsWith('$pbkdf2-sha512$')) {
      const parts = storedHash.split('$');
      // parts[0] is empty, parts[1] is 'pbkdf2-sha512', parts[2] is 'i=250000', parts[3] is 'l=64', parts[4] is salt, parts[5] is hash
      if (parts.length >= 6) {
        const iterMatch = parts[2].match(/i=(\d+)/);
        const iterations = iterMatch ? parseInt(iterMatch[1], 10) : CURRENT_PBKDF2_ITERATIONS;
        const salt = parts[4];
        const hash = parts[5];

        const computedHash = crypto.pbkdf2Sync(password, salt, iterations, KEY_LEN, DIGEST).toString('hex');
        const hashBuf = Buffer.from(hash, 'hex');
        const compBuf = Buffer.from(computedHash, 'hex');

        if (hashBuf.length !== compBuf.length) {
          return { valid: false, needsRehash: false };
        }
        const isValid = crypto.timingSafeEqual(hashBuf, compBuf);
        const needsRehash = iterations < CURRENT_PBKDF2_ITERATIONS;
        return { valid: isValid, needsRehash: isValid && needsRehash };
      }
    }

    // 2. Check for Legacy Format (salt:hash)
    const legacyParts = storedHash.split(':');
    if (legacyParts.length === 2) {
      const [salt, hash] = legacyParts;
      const computedLegacyHash = crypto.pbkdf2Sync(password, salt, LEGACY_PBKDF2_ITERATIONS, KEY_LEN, DIGEST).toString('hex');
      const hashBuf = Buffer.from(hash, 'hex');
      const compBuf = Buffer.from(computedLegacyHash, 'hex');

      if (hashBuf.length !== compBuf.length) {
        return { valid: false, needsRehash: false };
      }
      const isValid = crypto.timingSafeEqual(hashBuf, compBuf);
      return { valid: isValid, needsRehash: isValid }; // Legacy hashes always need rehash
    }

    return { valid: false, needsRehash: false };
  } catch {
    return { valid: false, needsRehash: false };
  }
}

/**
 * Password Policy:
 * - Minimum 12 characters
 * - Maximum 1024 characters (supports long passphrases and password managers)
 * - Safe Unicode handling
 * - No arbitrary symbol restrictions that block valid passphrases
 */
export function validatePasswordPolicy(password: string): { valid: boolean; reason?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, reason: 'Password is required.' };
  }
  if (password.length < 12) {
    return { valid: false, reason: 'Password must be at least 12 characters in length.' };
  }
  if (password.length > 1024) {
    return { valid: false, reason: 'Password must not exceed 1024 characters.' };
  }
  return { valid: true };
}

/**
 * Redact email for audit logging
 */
export function redactEmail(email?: string | null): string {
  if (!email || typeof email !== 'string') return 'anonymous';
  const parts = email.split('@');
  if (parts.length !== 2) return '***';
  const [user, domain] = parts;
  const userRedacted = user.length > 2 ? `${user[0]}***${user[user.length - 1]}` : `${user[0]}***`;
  const domainRedacted = domain.length > 3 ? `${domain[0]}***.${domain.split('.').pop()}` : domain;
  return `${userRedacted}@${domainRedacted}`;
}

// Rate Limiter Store
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function createRateLimiter(limit: number, windowMs: number, label: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV === 'test' || process.env.SKIP_RATE_LIMIT === 'true') {
      return next();
    }
    const rawIp = req.headers['x-forwarded-for'] || req.ip || 'unknown';
    const ip = Array.isArray(rawIp) ? rawIp[0] : String(rawIp).split(',')[0].trim();
    const key = `${label}:${ip}`;
    const now = Date.now();

    const record = rateLimitMap.get(key);
    if (record) {
      if (now > record.resetTime) {
        rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
        return next();
      }
      if (record.count >= limit) {
        return res.status(429).json({ 
          error: 'Too Many Requests', 
          message: `Too many ${label} attempts. Please wait a few minutes before trying again.` 
        });
      }
      record.count += 1;
      rateLimitMap.set(key, record);
    } else {
      rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    }
    next();
  };
}

export const loginRateLimiter = createRateLimiter(5, 15 * 60 * 1000, 'login');
export const resetRateLimiter = createRateLimiter(5, 60 * 60 * 1000, 'password-reset');
export const activationRateLimiter = createRateLimiter(5, 60 * 60 * 1000, 'account-activation');
export const invitationRateLimiter = createRateLimiter(10, 60 * 60 * 1000, 'invitation-creation');
