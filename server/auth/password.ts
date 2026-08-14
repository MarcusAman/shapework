/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

const PBKDF2_ITERATIONS = 100000;
const KEY_LEN = 64;
const DIGEST = 'sha512';

// Native cryptographically strong password hashing using PBKDF2 with 100,000 iterations
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LEN, DIGEST).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash?: string | null): boolean {
  if (!storedHash || typeof storedHash !== 'string') return false;
  try {
    const parts = storedHash.split(':');
    if (parts.length !== 2) return false;
    const [salt, hash] = parts;
    const verifyHash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LEN, DIGEST).toString('hex');
    const hashBuf = Buffer.from(hash, 'hex');
    const verifyBuf = Buffer.from(verifyHash, 'hex');
    if (hashBuf.length !== verifyBuf.length) return false;
    return crypto.timingSafeEqual(hashBuf, verifyBuf);
  } catch {
    return false;
  }
}

// Password validation policy: minimum 12 characters, allows password managers & paste
export function validatePasswordPolicy(password: string): { valid: boolean; reason?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, reason: 'Password is required.' };
  }
  if (password.length < 12) {
    return { valid: false, reason: 'Password must be at least 12 characters in length.' };
  }
  if (password.length > 128) {
    return { valid: false, reason: 'Password must not exceed 128 characters.' };
  }
  return { valid: true };
}

// Redact email for audit logging
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

function createRateLimiter(limit: number, windowMs: number, label: string) {
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
export const resetRateLimiter = createRateLimiter(3, 60 * 60 * 1000, 'password-reset');
export const activationRateLimiter = createRateLimiter(5, 60 * 60 * 1000, 'account-activation');
