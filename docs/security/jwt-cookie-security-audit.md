# JWT Session & Cookie Security Audit Report

This document reports findings from the comprehensive security review of JWT generation, cryptographic signatures, and cookie delivery mechanics.

---

## 1. Cryptographic Signatures & JWT Structure

* **Signing Algorithm**: JSON Web Tokens are signed using **HMAC-SHA256 (HS256)** signatures.
* **Secret Configuration**: In `production` mode, the server strictly validates that `JWT_SECRET` is defined in the system environment, failing closed on startup if it is missing.
* **Token Structure**:
  * **Header**: Declares standard `alg: HS256` and `typ: JWT` parameters.
  * **Payload**: Contains minimal, non-sensitive identifying claims (`userId`, `email`, `role`). No database credentials, system secrets, or detailed profile details are ever exposed inside the token.
  * **Expiration Claim (`exp`)**: Configured with a default expiry limit of **3600 seconds (1 hour)**, after which verification fails.

---

## 2. Cookie Delivery Security Flags

* **HttpOnly Restriction**: The `shapework_session` cookie is configured with the `HttpOnly` flag, preventing clientside javascript (`document.cookie`) from reading the session.
* **Secure Flag**: Enforced dynamically. When `APP_MODE=production` is active, the cookie header includes the `; Secure` directive, requiring an encrypted HTTPS connection.
* **SameSite Policy**: Explicitly set to `SameSite=Strict`. This ensures the cookie is never sent along with cross-site requests, providing robust protection against default CSRF attacks.
* **Path Bounds**: Set to a narrow path `Path=/` to ensure scope-bound delivery only to target API endpoints.

---

## 3. Session Revocation Blocker (Self-Serve Graduation)

* **Logout Cleans Cookie**: Calling `/api/auth/logout` sets the cookie to `Max-Age=0` and `Expires` in the past, causing the browser to immediately delete the token.
* **Copied Token Replay Vulnerability**: Because token verification is currently **stateless**, if a valid token is copied/intercepted before logout, it remains valid on the server side until its natural `exp` time is reached. There is currently no active session blacklist/database validation.
* **Blocker Verdict**: This stateless session behavior is marked as a **Blocker for self-serve customer access** and must be resolved by introducing a database-backed session registry in a future sprint.
