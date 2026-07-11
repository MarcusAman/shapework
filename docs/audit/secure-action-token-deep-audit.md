# Secure Action Token Deep Audit Report

## 1. Executive Summary
This audit validates the security architecture of the token generation, resolution, and expiration rules within the Shapework headless operations layer. The layer utilizes cryptographically secure tokens to authenticate users landing on portals without passwords.

---

## 2. Token Security Characteristics

### A. Entropy and Hashing at Rest
* **Generation**: Tokens are created using `crypto.randomBytes(32).toString('hex')` providing 256 bits of entropy.
* **Storage**: The plain-text token is never stored in the database. Only the SHA-256 hash of the token (`secureTokenHash`) is persisted, preventing database compromises from leaking active authentication vectors.

### B. Single-Use and Expiration Constraints
* **Lifespan**: Headless actions default to a strict 24-hour expiration window.
* **Portal Lifespan**: Client Deal Portals have a 30-day window; Agent Action Portals have a 7-day window.
* **Single-Use Enforcement**: In `headlessActionRules.ts`, if an action status is `completed` or `expired`, any subsequent resolution request fails immediately and returns `null`. Once completed, the token cannot be reused to modify state.

### C. Scope Boundaries
* The token resolution data is restricted. When resolved, the payload is explicitly filtered to include only scoped fields (`actionId`, `actionType`, `sourceType`, `sourceId`, `status`, etc.). No internal database contexts are leaked.

---

## 3. Rate Limiting and Tampering Controls
* Rate limits are enforced on resolve routes.
* Param tampering (modifying the token length or characters) results in hash mismatches, failing closed.
* Expired tokens are marked as `expired` at the database level upon resolution attempt.

---

## 4. Audit Trail
* All actions transition states safely (`queued` -> `sent` -> `clicked` -> `completed` / `expired`) and log secure events via `logHeadlessAudit()`.
* Logs contain no unhashed action tokens or database raw IDs.
