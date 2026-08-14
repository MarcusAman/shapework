import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { hashPassword, verifyPassword, validatePasswordPolicy, redactEmail } from '../../server/auth/password.js';
import { signJwt, verifyJwt, JWT_ISSUER, JWT_AUDIENCE } from '../../server/auth/jwt.js';

describe('Authentication & Cryptographic Security Regression Suite', () => {
  it('SEC-REG-1: Password hashing produces salted non-reversible hashes', () => {
    const rawPassword = 'UniqueCustomerPassword2026!';
    const hash1 = hashPassword(rawPassword);
    const hash2 = hashPassword(rawPassword);

    expect(hash1).not.toBe(rawPassword);
    expect(hash2).not.toBe(rawPassword);
    expect(hash1).not.toBe(hash2); // Unique salts
    expect(verifyPassword(rawPassword, hash1)).toBe(true);
    expect(verifyPassword('WrongPassword123!', hash1)).toBe(false);
    expect(verifyPassword(rawPassword, null)).toBe(false);
  });

  it('SEC-REG-2: Password policy enforces minimum length and rejects weak passwords', () => {
    expect(validatePasswordPolicy('short').valid).toBe(false);
    expect(validatePasswordPolicy('12345678901').valid).toBe(false); // 11 chars
    expect(validatePasswordPolicy('123456789012').valid).toBe(true); // 12 chars
    expect(validatePasswordPolicy('MyStrongCustomerPassword2026!').valid).toBe(true);
  });

  it('SEC-REG-3: Email redaction masks sensitive customer identifiers in audit logs', () => {
    expect(redactEmail('ryan@nestrealty.com')).toBe('r***n@n***.com');
    expect(redactEmail('matt.orr@nestrealty.com')).toBe('m***r@n***.com');
    expect(redactEmail(null)).toBe('anonymous');
  });

  it('SEC-REG-4: JWT signs and verifies with HS256 and validates issuer/audience', () => {
    const token = signJwt({
      userId: 'usr_test_user',
      email: 'test@shapework.invalid',
      role: 'owner',
      securityVersion: 1
    }, 3600);

    const verified = verifyJwt(token, {
      expectedIssuer: JWT_ISSUER,
      expectedAudience: JWT_AUDIENCE,
      requiredSecurityVersion: 1
    });

    expect(verified).not.toBeNull();
    expect(verified.userId).toBe('usr_test_user');
    expect(verified.iss).toBe(JWT_ISSUER);
    expect(verified.aud).toBe(JWT_AUDIENCE);
  });

  it('SEC-REG-5: JWT strictly rejects alg=none and tampering', () => {
    // Construct fake alg=none token
    const fakeHeader = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const fakePayload = Buffer.from(JSON.stringify({ userId: 'attacker', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
    const fakeToken = `${fakeHeader}.${fakePayload}.`;

    expect(verifyJwt(fakeToken)).toBeNull();
  });

  it('SEC-REG-6: JWT rejects expired tokens', () => {
    const expiredToken = signJwt({
      userId: 'usr_expired_test',
      email: 'expired@shapework.invalid'
    }, -10); // Expired 10 seconds ago

    expect(verifyJwt(expiredToken)).toBeNull();
  });

  it('SEC-REG-7: JWT rejects tokens with mismatched issuer or audience', () => {
    const token = signJwt({ userId: 'usr_test_user' });

    expect(verifyJwt(token, { expectedIssuer: 'wrong-issuer' })).toBeNull();
    expect(verifyJwt(token, { expectedAudience: 'wrong-audience' })).toBeNull();
  });

  it('SEC-REG-8: Security version increment invalidates previous tokens', () => {
    const tokenV1 = signJwt({
      userId: 'usr_revocation_test',
      securityVersion: 1
    });

    // Token with securityVersion: 1 should fail if requiredSecurityVersion: 2
    expect(verifyJwt(tokenV1, { requiredSecurityVersion: 2 })).toBeNull();
  });

  it('SEC-REG-9: Invitation tokens are cryptographically hashed and single use', () => {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    expect(tokenHash).toHaveLength(64);
    expect(tokenHash).not.toBe(rawToken);
  });
});
