/**
 * Credential Vault Security & Cryptography Verification Suite
 * Verifies AES-256-GCM authenticated encryption and fail-closed security invariants.
 */

import { execSync } from 'child_process';

const runTestCase = (envVars: Record<string, string>, inlineCode: string) => {
  const cmd = `npx tsx -e "${inlineCode.replace(/\n/g, ' ')}"`;
  try {
    const stdout = execSync(cmd, { 
      stdio: 'pipe',
      env: {
        ...process.env,
        ...envVars
      }
    }).toString();
    return { exitCode: 0, stdout, stderr: '' };
  } catch (err: any) {
    return { 
      exitCode: err.status || 1, 
      stdout: err.stdout?.toString() || '', 
      stderr: err.stderr?.toString() || err.message 
    };
  }
};

console.log('========================================================================');
console.log('CREDENTIAL VAULT CRYPTOGRAPHY & FAIL-CLOSED SUITE');
console.log('Algorithm: AES-256-GCM | IV: 96-bit | Auth Tag: 128-bit | Key: 256-bit');
console.log('========================================================================\n');

let totalPassed = 0;
let totalFailed = 0;

// Test 1: Missing Key (Fail-Closed)
const c1 = runTestCase({ APP_MODE: 'uat', CREDENTIAL_ENCRYPTION_KEY: '', ALLOW_INSECURE_DEV_VAULT: 'false' }, `
  import { credentialVault } from './server/security/vault.js';
  credentialVault.encrypt('test_payload');
`);
if (c1.exitCode !== 0) { console.log('✓ Case 1: Missing Key -> FAIL-CLOSED (Exit Code 1)'); totalPassed++; }
else { console.error('❌ Case 1 FAILED'); totalFailed++; }

// Test 2: Short Key (<32 bytes)
const c2 = runTestCase({ APP_MODE: 'uat', CREDENTIAL_ENCRYPTION_KEY: 'too_short_key', ALLOW_INSECURE_DEV_VAULT: 'false' }, `
  import { credentialVault } from './server/security/vault.js';
  credentialVault.encrypt('test_payload');
`);
if (c2.exitCode !== 0) { console.log('✓ Case 2: Short Key (<32 bytes) -> FAIL-CLOSED (Exit Code 1)'); totalPassed++; }
else { console.error('❌ Case 2 FAILED'); totalFailed++; }

// Test 3: Malformed Key (Whitespace)
const c3 = runTestCase({ APP_MODE: 'uat', CREDENTIAL_ENCRYPTION_KEY: '               ', ALLOW_INSECURE_DEV_VAULT: 'false' }, `
  import { credentialVault } from './server/security/vault.js';
  credentialVault.encrypt('test_payload');
`);
if (c3.exitCode !== 0) { console.log('✓ Case 3: Malformed Key -> FAIL-CLOSED (Exit Code 1)'); totalPassed++; }
else { console.error('❌ Case 3 FAILED'); totalFailed++; }

// Test 4: Valid 32-byte Key & Format Verification
const c4 = runTestCase({ APP_MODE: 'uat', CREDENTIAL_ENCRYPTION_KEY: 'valid_encryption_key_32_chars_long!', ALLOW_INSECURE_DEV_VAULT: 'false' }, `
  import { credentialVault } from './server/security/vault.js';
  credentialVault.encrypt({ token: 'secret_oauth_token_xyz_999' }).then(enc => {
    return credentialVault.decrypt(enc).then(dec => {
      const parts = enc.split(':');
      if (dec.token === 'secret_oauth_token_xyz_999' && parts.length === 4 && parts[0] === 'ref_v1') {
        console.log('VAULT_VALID_OK');
      } else { process.exit(1); }
    });
  }).catch(() => process.exit(1));
`);
if (c4.exitCode === 0) { console.log('✓ Case 4: Valid 32-byte Key AES-256-GCM Envelope -> PASS (ref_v1:iv:tag:ciphertext)'); totalPassed++; }
else { console.error('❌ Case 4 FAILED:', c4.stderr || c4.stdout); totalFailed++; }

// Test 5: Wrong Key Decryption Attempt
const c5 = runTestCase({ APP_MODE: 'uat', CREDENTIAL_ENCRYPTION_KEY: 'wrong_encryption_key_32_chars_long!', ALLOW_INSECURE_DEV_VAULT: 'false' }, `
  import { credentialVault } from './server/security/vault.js';
  const ciphertext = 'ref_v1:7a92b3c4d5e6f1a2b3c4d5e6:8f9e0a1b2c3d4e5f6a7b8c9d0e1f2a3b:4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f';
  credentialVault.decrypt(ciphertext).then(() => process.exit(1)).catch(() => console.log('SUCCESS_WRONG_KEY_FAILED_SAFELY'));
`);
if (c5.exitCode === 0) { console.log('✓ Case 5: Wrong Key Decrypt -> REJECTED SAFELY (Auth Tag Failure)'); totalPassed++; }
else { console.error('❌ Case 5 FAILED:', c5.stderr || c5.stdout); totalFailed++; }

// Test 6: Corrupted Ciphertext Tamper Attempt
const c6 = runTestCase({ APP_MODE: 'uat', CREDENTIAL_ENCRYPTION_KEY: 'valid_encryption_key_32_chars_long!', ALLOW_INSECURE_DEV_VAULT: 'false' }, `
  import { credentialVault } from './server/security/vault.js';
  credentialVault.encrypt({ data: 'authentic' }).then(enc => {
    const parts = enc.split(':');
    const tampered = parts[0] + ':' + parts[1] + ':' + parts[2] + ':' + parts[3].substring(0, parts[3].length - 2) + 'ff';
    return credentialVault.decrypt(tampered).then(() => process.exit(1)).catch(() => console.log('SUCCESS_TAMPER_REJECTED'));
  });
`);
if (c6.exitCode === 0) { console.log('✓ Case 6: Corrupted Ciphertext Tampering -> REJECTED SAFELY'); totalPassed++; }
else { console.error('❌ Case 6 FAILED:', c6.stderr || c6.stdout); totalFailed++; }

// Test 7: Local Dev Insecure Override (Dev Mode Only)
const c7 = runTestCase({ APP_MODE: 'development', CREDENTIAL_ENCRYPTION_KEY: '', ALLOW_INSECURE_DEV_VAULT: 'true' }, `
  import { credentialVault } from './server/security/vault.js';
  credentialVault.encrypt({ test: 'dev' }).then(enc => {
    if (enc.startsWith('dev_plain:')) console.log('DEV_OVERRIDE_OK');
    else process.exit(1);
  });
`);
if (c7.exitCode === 0) { console.log('✓ Case 7: Local Dev Insecure Override -> PASS (Development Mode Only)'); totalPassed++; }
else { console.error('❌ Case 7 FAILED:', c7.stderr || c7.stdout); totalFailed++; }

// Test 8: UAT Refuses Insecure Override
const c8 = runTestCase({ APP_MODE: 'uat', CREDENTIAL_ENCRYPTION_KEY: '', ALLOW_INSECURE_DEV_VAULT: 'true' }, `
  import { credentialVault } from './server/security/vault.js';
  credentialVault.encrypt({ test: 'uat' });
`);
if (c8.exitCode !== 0) { console.log('✓ Case 8: UAT Refuses Insecure Override -> FAIL-CLOSED (Exit Code 1)'); totalPassed++; }
else { console.error('❌ Case 8 FAILED:', c8.stderr || c8.stdout); totalFailed++; }

console.log(`\nVault Cryptography Verification: ${totalPassed} Passed, ${totalFailed} Failed.`);
if (totalFailed > 0) process.exit(1);
