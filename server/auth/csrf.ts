/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response, NextFunction } from 'express';

/**
 * CSRF Protection Middleware for State-Changing Requests (POST, PUT, DELETE, PATCH)
 * Enforces Origin/Referer verification, custom header verification (x-shapework-csrf), and Bearer immunity.
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  const method = req.method;
  const stateChangingMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
  if (!stateChangingMethods.includes(method)) {
    return next();
  }

  // Exempt public intake endpoints and server-to-server HMAC-verified webhooks
  const exemptPaths = [
    '/api/auth/login',
    '/api/auth/activate',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/discovery/inquire',
    '/api/retell/'
  ];

  if (exemptPaths.some(p => req.path.startsWith(p))) {
    return next();
  }

  // 1. Authorization header requests (Bearer tokens) are immune to browser cross-site ambient credential CSRF
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return next();
  }

  // 2. Custom header check (x-shapework-csrf or x-requested-with)
  const csrfHeader = req.headers['x-shapework-csrf'] || req.headers['x-requested-with'];
  if (csrfHeader) {
    return next();
  }

  const origin = req.headers['origin'];
  const referer = req.headers['referer'];
  const host = req.headers['host'] || 'localhost:8080';

  const isTrustedHost = (h: string) => {
    return h === host ||
           h.includes('run.app') ||
           h.includes('shapework.co') ||
           h.includes('nestrealty.com') ||
           h.startsWith('localhost:') ||
           h.startsWith('127.0.0.1:') ||
           h === 'localhost' ||
           h === '127.0.0.1';
  };

  if (origin) {
    try {
      const originUrl = new URL(String(origin));
      const originHost = originUrl.host;
      if (!isTrustedHost(originHost)) {
        console.warn(`[CSRF] Blocked request from mismatched origin: ${origin} (Host: ${host})`);
        return res.status(403).json({ 
          error: 'Forbidden', 
          message: 'CSRF protection block: origin host mismatch.' 
        });
      }
      return next();
    } catch (err) {
      return res.status(400).json({ error: 'Bad Request', message: 'Invalid Origin header.' });
    }
  }

  if (referer) {
    try {
      const refererUrl = new URL(String(referer));
      const refererHost = refererUrl.host;
      if (!isTrustedHost(refererHost)) {
        console.warn(`[CSRF] Blocked request from mismatched referer: ${referer} (Host: ${host})`);
        return res.status(403).json({ 
          error: 'Forbidden', 
          message: 'CSRF protection block: referer host mismatch.' 
        });
      }
      return next();
    } catch (err) {
      return res.status(400).json({ error: 'Bad Request', message: 'Invalid Referer header.' });
    }
  }

  const isUatOrProd = process.env.APP_MODE === 'production' || process.env.APP_ENV === 'uat';
  if (isUatOrProd && req.headers.cookie) {
    // In production/UAT, ambient cookie-based requests must have Origin, Referer, or x-shapework-csrf header
    console.warn(`[CSRF] Blocked cookie mutation: missing Origin/Referer/CSRF headers.`);
    return res.status(403).json({ 
      error: 'Forbidden', 
      message: 'CSRF defense triggered: custom header (x-shapework-csrf) or valid Origin required.' 
    });
  }

  next();
}
