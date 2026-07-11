/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response, NextFunction } from 'express';

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  const method = req.method;
  const stateChangingMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
  if (!stateChangingMethods.includes(method)) {
    return next();
  }

  const origin = req.headers['origin'];
  const referer = req.headers['referer'];
  const host = req.headers['host'] || 'localhost:3000';

  const allowedOriginsStr = process.env.ALLOWED_ORIGINS || '';
  const allowedOrigins = allowedOriginsStr
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

  const allowedHosts = allowedOrigins.map(o => {
    try {
      return new URL(o).host;
    } catch {
      return o;
    }
  });

  const isTrustedHost = (h: string) => {
    return h === host ||
           h === '127.0.0.1:3007' ||
           h === 'localhost:3007' ||
           h === '127.0.0.1:3000' ||
           h === 'localhost:3000' ||
           allowedHosts.includes(h) ||
           h.startsWith('localhost:') ||
           h.startsWith('127.0.0.1:');
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
    } catch (err) {
      return res.status(400).json({ error: 'Bad Request', message: 'Invalid Origin header.' });
    }
  } else if (referer) {
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
    } catch (err) {
      return res.status(400).json({ error: 'Bad Request', message: 'Invalid Referer header.' });
    }
  } else if (process.env.APP_MODE === 'production') {
    // In production, require at least Origin or Referer for state-changing operations
    console.warn(`[CSRF] Blocked request: missing Origin and Referer headers in production mode.`);
    return res.status(403).json({ 
      error: 'Forbidden', 
      message: 'CSRF protection block: Origin or Referer header required.' 
    });
  }

  next();
}
