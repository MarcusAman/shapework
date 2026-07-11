# Authentication & Login Security Audit Report

This document reports findings from the comprehensive security review of the `/api/auth/login` endpoint and its related credential-verification safeguards.

---

## 1. Credentials Verification & Cryptographic Hashing

* **Required Inputs**: The authentication gate enforces input validation, requiring both a valid, registered email address and its matching password. Mocks and email-only authentication are completely disabled.
* **Storage Standard**: User passwords are encrypted utilizing Node.js native cryptographic libraries via **PBKDF2** hashing with random 16-byte salts and 1000 iterations of SHA-512. No plaintext password is ever written to memory, databases, logs, or flat files.
* **Authentication Proof**: The system queries the `users` and `workspace_memberships` tables to confirm the match of the input password against the stored salt and hash using timing-safe comparisons (`crypto.timingSafeEqual`) to prevent side-channel timing analysis.

---

## 2. Access Control & User Status Gating

* **Fake User Verification**: Any request supplying a non-existent email will be rejected immediately.
* **Account Lifecycle Constraints**: The authentication logic explicitly verifies user statuses. If a user record is suspended (`status = 'suspended'`) or soft-deleted, access is denied immediately, even if correct credentials are provided.
* **User Enumeration Defense**: The server intercepts all failed login attempts (whether due to missing emails, mismatched passwords, or suspended account status) and returns a unified, generic error message:
  `Invalid email or password.`
  This prevents malicious actors from checking user presence via API response differences.

---

## 3. Rate Limiting & Logs Auditing

* **Rate Limiting**: To mitigate brute-force dictionary attacks, the `/api/auth/login` route is protected by a memory-based IP rate limiter middleware (`loginRateLimiter`). Requests are restricted to a maximum of 5 attempts per IP per minute. Excess attempts trigger `429 Too Many Requests`.
* **Safe Logging**: Failed login attempts are logged to standard error (`console.warn`) for security monitoring, recording only the target email without leaking any password input or sensitive profile data.
