/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

// Native password hashing using PBKDF2
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const parts = storedHash.split(':');
    if (parts.length !== 2) return false;
    const [salt, hash] = parts;
    const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verifyHash, 'hex'));
  } catch (err) {
    return false;
  }
}

// Simple in-memory login rate limiter
const loginAttempts = new Map<string, { count: number; resetTime: number }>();

export function loginRateLimiter(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV === 'test' || process.env.SKIP_RATE_LIMIT === 'true' || process.env.APP_MODE === 'uat') {
    return next();
  }
  const rawIp = req.headers['x-forwarded-for'] || req.ip || 'unknown';
  const ip = Array.isArray(rawIp) ? rawIp[0] : rawIp.split(',')[0].trim();
  const now = Date.now();
  const limit = 5; // max 5 attempts
  const windowMs = 60 * 1000; // 1 minute window

  const attempts = loginAttempts.get(String(ip));
  if (attempts) {
    if (now > attempts.resetTime) {
      loginAttempts.set(String(ip), { count: 1, resetTime: now + windowMs });
      return next();
    }
    if (attempts.count >= limit) {
      console.warn(`[Auth] Rate limit exceeded for IP: ${ip}`);
      return res.status(429).json({ 
        error: 'Too Many Requests', 
        message: 'Too many login attempts. Please try again in 1 minute.' 
      });
    }
    attempts.count += 1;
    loginAttempts.set(String(ip), attempts);
  } else {
    loginAttempts.set(String(ip), { count: 1, resetTime: now + windowMs });
  }
  next();
}
