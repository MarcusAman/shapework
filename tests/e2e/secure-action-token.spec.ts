import { test, expect } from '@playwright/test';
import crypto from 'crypto';
import { generateSecureActionToken, validateSecureActionToken, useSecureActionToken } from '../../server/notifications/notificationToken';

test('secure action token cryptographic safety, hashing, and expiration validation', async () => {
  const dbState = {
    secureActionTokens: [] as any[],
    auditEvents: [] as any[]
  };

  // 1. Generate token
  const { token, secureToken } = generateSecureActionToken(
    dbState,
    'test-workspace',
    'user-123',
    'complete_work_item',
    'wi_100'
  );

  // Assert raw token is random hex (32 bytes = 64 characters)
  expect(token).toHaveLength(64);
  
  // Assert raw token is not stored in dbState
  const savedTokenObj = dbState.secureActionTokens[0];
  expect(savedTokenObj.tokenHash).toBeDefined();
  expect(JSON.stringify(savedTokenObj)).not.toContain(token);

  // Assert tokenHash is SHA-256 of raw token
  const expectedHash = crypto.createHash('sha256').update(token).digest('hex');
  expect(savedTokenObj.tokenHash).toBe(expectedHash);

  // 2. Validate token (successful validation)
  const validated = validateSecureActionToken(dbState, token);
  expect(validated).not.toBeNull();
  expect(validated?.workItemId).toBe('wi_100');

  // 3. Complete/Use token
  const used = useSecureActionToken(dbState, token);
  expect(used).toBe(true);

  // 4. Validate again (should be blocked as already used)
  const validatedAgain = validateSecureActionToken(dbState, token);
  expect(validatedAgain).toBeNull();

  // 5. Test expiration check
  const expiredTokenRes = generateSecureActionToken(
    dbState,
    'test-workspace',
    'user-123',
    'complete_work_item',
    'wi_200'
  );

  // Manually force expiration in DB state
  const expiredDbObj = dbState.secureActionTokens.find(t => t.tokenHash === expiredTokenRes.secureToken.tokenHash);
  expiredDbObj.expiresAt = new Date(Date.now() - 1000).toISOString(); // 1 sec ago

  // Validation of expired token should fail
  const validatedExpired = validateSecureActionToken(dbState, expiredTokenRes.token);
  expect(validatedExpired).toBeNull();
});
