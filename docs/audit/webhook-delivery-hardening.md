# Webhook Delivery Hardening Audit Report

## 1. Scope & Audited Files
* [`server/headless/webhookDispatcher.ts`](file:///Users/marcusaman/Downloads/shapework%20(2)/server/headless/webhookDispatcher.ts)

---

## 2. Findings and Verification

### A. SSRF Protections
* **Blocklist Enforcement**: In `webhookDispatcher.ts`, incoming hostnames are checked via `isPrivateAddress()` to prevent SSRF (Server-Side Request Forgery).
* **Blocked targets in Production**: `localhost`, `127.0.0.1`, `::1`, `10.*.*.*`, `172.16.0.0` - `172.31.255.255`, `192.168.*.*`, `169.254.169.254`.
* **Behavior**: If the host is private, the dispatch is aborted, and a security audit event is logged.

### B. Cryptographic Payloads & Replay Attacks
* **Signature Base Construction**: Signature is computed using:
  `const signatureBase = `${timestamp}.${deliveryId}.${payloadString}`;`
* **HMAC SHA-256 Signing**: The signature is generated using the SHA-256 HMAC of the secret hash and signature base.
* **Headers Dispatched**:
  * `X-Shapework-Signature` (HMAC hex)
  * `X-Shapework-Timestamp` (POSIX timestamp)
  * `X-Shapework-Event` (Event type)
  * `X-Shapework-Delivery-Id` (UUID/random identifier)
* **Replay Protection**: The receiver can verify the signature and reject requests outside a 5-minute replay window using `X-Shapework-Timestamp`.

### C. Retry and Backoff Policy
* If the dispatch encounters a network failure, the dispatcher schedules a retry (up to 2 total attempts) after a 1-second delay.

### D. Safe Log Policy
* Webhook dispatches are logged to `dbState.webhookDeliveries` with the status code and delivery ID. The JSON payloads are excluded to prevent logging sensitive client details.
