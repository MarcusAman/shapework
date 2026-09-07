/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';

export const JWT_ISSUER = process.env.JWT_ISSUER || 'shapework-uat-auth';
export const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'shapework-uat-app';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return 'shapework-production-secure-auth-jwt-token-signing-key-2026';
  }
  return secret;
}

function base64urlEncode(str: string | Buffer): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64urlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

export interface JwtSignOptions {
  expiresInSeconds?: number;
  issuer?: string;
  audience?: string;
  securityVersion?: number;
}

export function signJwt(payload: any, options: number | JwtSignOptions = 3600): string {
  const opts: JwtSignOptions = typeof options === 'number' ? { expiresInSeconds: options } : options;
  const expiresInSeconds = opts.expiresInSeconds || 3600;
  const issuer = opts.issuer || JWT_ISSUER;
  const audience = opts.audience || JWT_AUDIENCE;

  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const exp = now + expiresInSeconds;

  const fullPayload = {
    ...payload,
    iss: issuer,
    aud: audience,
    iat: now,
    exp,
    jti: crypto.randomBytes(16).toString('hex'),
    securityVersion: opts.securityVersion || payload.securityVersion || 1
  };

  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(fullPayload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const secret = getJwtSecret();
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signatureInput)
    .digest();
  const encodedSignature = base64urlEncode(signature);

  return `${signatureInput}.${encodedSignature}`;
}

export interface JwtVerifyOptions {
  expectedIssuer?: string;
  expectedAudience?: string;
  requiredSecurityVersion?: number;
}

export function verifyJwt(token: string, options?: JwtVerifyOptions): any | null {
  try {
    if (!token || typeof token !== 'string') return null;

    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, encodedSignature] = parts;

    // 1. Strict Algorithm Allowlisting
    const headerJson = JSON.parse(base64urlDecode(encodedHeader));
    if (!headerJson || headerJson.alg !== 'HS256' || headerJson.typ !== 'JWT') {
      return null; // Reject alg: none, RS256, or mismatched algorithms
    }

    // 2. Cryptographic Signature Validation with Timing Safety
    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    const secret = getJwtSecret();
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signatureInput)
      .digest();
    const encodedExpectedSignature = base64urlEncode(expectedSignature);

    const sigBufA = Buffer.from(encodedSignature);
    const sigBufB = Buffer.from(encodedExpectedSignature);

    if (sigBufA.length !== sigBufB.length || !crypto.timingSafeEqual(sigBufA, sigBufB)) {
      return null;
    }

    // 3. Claims Validation
    const payload = JSON.parse(base64urlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);

    // Expiration Check
    if (payload.exp && now > payload.exp) {
      return null; // Token expired
    }

    // Not-Before Check
    if (payload.nbf && now < payload.nbf) {
      return null;
    }

    // Issuer Check
    const expectedIss = options?.expectedIssuer || JWT_ISSUER;
    if (expectedIss && payload.iss && payload.iss !== expectedIss) {
      return null;
    }

    // Audience Check
    const expectedAud = options?.expectedAudience || JWT_AUDIENCE;
    if (expectedAud && payload.aud && payload.aud !== expectedAud) {
      return null;
    }

    // Security Version Check
    if (options?.requiredSecurityVersion !== undefined) {
      const tokenSecVer = payload.securityVersion !== undefined ? payload.securityVersion : 1;
      if (tokenSecVer < options.requiredSecurityVersion) {
        return null; // Token revoked due to security version increment
      }
    }

    return payload;
  } catch {
    return null;
  }
}
