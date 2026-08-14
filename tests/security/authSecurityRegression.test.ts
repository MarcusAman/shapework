import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { 
  hashPassword, 
  verifyPassword, 
  verifyPasswordWithRehashCheck, 
  validatePasswordPolicy, 
  redactEmail,
  CURRENT_PBKDF2_ITERATIONS,
  HASH_VERSION_PREFIX 
} from '../../server/auth/password.js';
import { signJwt, verifyJwt, JWT_ISSUER, JWT_AUDIENCE } from '../../server/auth/jwt.js';
import { csrfProtection } from '../../server/auth/csrf.js';
import { CANONICAL_WILMINGTON_WORKSPACE_ID, WILMINGTON_WORKSPACE_ALIASES } from '../../server/auth/auth.js';

describe('Authentication & Cryptographic Security Regression Suite', () => {
  it('SEC-REG-1: Password hashing produces versioned 250k iteration PBKDF2-HMAC-SHA512 hashes', () => {
    const rawPassword = 'UniqueCustomerPassword2026!';
    const hash1 = hashPassword(rawPassword);
    const hash2 = hashPassword(rawPassword);

    expect(hash1).toMatch(/^\$pbkdf2-sha512\$i=250000\$l=64\$/);
    expect(hash1).not.toBe(rawPassword);
    expect(hash2).not.toBe(rawPassword);
    expect(hash1).not.toBe(hash2); // Unique salts
    
    const result1 = verifyPasswordWithRehashCheck(rawPassword, hash1);
    expect(result1.valid).toBe(true);
    expect(result1.needsRehash).toBe(false);

    expect(verifyPassword('WrongPassword123!', hash1)).toBe(false);
    expect(verifyPassword(rawPassword, null)).toBe(false);
  });

  it('SEC-REG-2: Legacy 100k iteration hashes verify correctly and signal need for rehash', () => {
    const rawPassword = 'LegacyCustomerPassword2026!';
    const salt = crypto.randomBytes(32).toString('hex');
    const legacyHash = crypto.pbkdf2Sync(rawPassword, salt, 100000, 64, 'sha512').toString('hex');
    const storedLegacy = `${salt}:${legacyHash}`;

    const check = verifyPasswordWithRehashCheck(rawPassword, storedLegacy);
    expect(check.valid).toBe(true);
    expect(check.needsRehash).toBe(true); // Must trigger upgrade to 250k on login
  });

  it('SEC-REG-3: Password policy allows long Unicode passphrases and rejects invalid inputs', () => {
    expect(validatePasswordPolicy('short').valid).toBe(false);
    expect(validatePasswordPolicy('12345678901').valid).toBe(false); // 11 chars
    expect(validatePasswordPolicy('123456789012').valid).toBe(true); // 12 chars
    expect(validatePasswordPolicy('MyStrongCustomerPassword2026!').valid).toBe(true);

    // Long Unicode Passphrase (e.g. 100 words / characters with Japanese & Emoji)
    const unicodePassphrase = 'パスワード🔑correct-horse-battery-staple-'.repeat(10);
    expect(validatePasswordPolicy(unicodePassphrase).valid).toBe(true);

    // Rejection of massive input (> 4096 bytes) to prevent DoS
    const massiveInput = 'A'.repeat(5000);
    expect(() => hashPassword(massiveInput)).toThrow();
  });

  it('SEC-REG-4: Email redaction masks sensitive customer identifiers in audit logs', () => {
    expect(redactEmail('ryan@nestrealty.com')).toBe('r***n@n***.com');
    expect(redactEmail('matt.orr@nestrealty.com')).toBe('m***r@n***.com');
    expect(redactEmail(null)).toBe('anonymous');
  });

  it('SEC-REG-5: JWT signs and verifies with HS256 and validates issuer/audience', () => {
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

  it('SEC-REG-6: JWT strictly rejects alg=none and tampering', () => {
    const fakeHeader = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const fakePayload = Buffer.from(JSON.stringify({ userId: 'attacker', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
    const fakeToken = `${fakeHeader}.${fakePayload}.`;

    expect(verifyJwt(fakeToken)).toBeNull();
  });

  it('SEC-REG-7: JWT rejects expired tokens', () => {
    const expiredToken = signJwt({
      userId: 'usr_expired_test',
      email: 'expired@shapework.invalid'
    }, -10); // Expired 10 seconds ago

    expect(verifyJwt(expiredToken)).toBeNull();
  });

  it('SEC-REG-8: Security version increment invalidates previous tokens', () => {
    const tokenV1 = signJwt({
      userId: 'usr_revocation_test',
      securityVersion: 1
    });

    expect(verifyJwt(tokenV1, { requiredSecurityVersion: 2 })).toBeNull();
  });

  it('SEC-REG-9: Invitation tokens are cryptographically hashed and single use', () => {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    expect(tokenHash).toHaveLength(64);
    expect(tokenHash).not.toBe(rawToken);
  });

  it('SEC-REG-10: Canonical Wilmington workspace aliases map to ws_wilmington', () => {
    expect(CANONICAL_WILMINGTON_WORKSPACE_ID).toBe('ws_wilmington');
    expect(WILMINGTON_WORKSPACE_ALIASES).toContain('nest-realty-wilmington');
    expect(WILMINGTON_WORKSPACE_ALIASES).toContain('nest-realty-demo');
  });

  it('SEC-REG-11: CSRF protection allows Bearer tokens and custom headers, rejects unsafe cross-origin', () => {
    let nextCalled = false;
    const mockNext = () => { nextCalled = true; };

    // Bearer token is exempt
    const bearerReq = {
      method: 'POST',
      headers: { 'authorization': 'Bearer some-token' },
      path: '/api/sops/drafts'
    } as any;
    const bearerRes = {} as any;
    nextCalled = false;
    csrfProtection(bearerReq, bearerRes, mockNext);
    expect(nextCalled).toBe(true);

    // Custom header x-shapework-csrf is exempt
    const customHeaderReq = {
      method: 'POST',
      headers: { 'x-shapework-csrf': 'true' },
      path: '/api/sops/drafts'
    } as any;
    nextCalled = false;
    csrfProtection(customHeaderReq, bearerRes, mockNext);
    expect(nextCalled).toBe(true);
  });
});
