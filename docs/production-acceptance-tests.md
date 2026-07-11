# Production Acceptance Tests Specifications

This document outlines the validation procedures to certify shapework. launch readiness on staging/production environments.

---

## 1. Vault & Security Hardening
- **Secret Key Verification**: Confirm `CREDENTIAL_ENCRYPTION_KEY` environment variable exists.
- **Opaque Webhook Routing**: Confirm that Dotloop webhook URLs contain opaque hashes instead of readable workspace slugs.
- **API Token Protection**: Confirm that endpoint responses redact tokens, private signatures, or full PII.

---

## 2. Background Queue & Worker Verification
- **Deduplication Filter**: Ingest two identical Dotloop webhook event payloads sequentially. Verify the gateway registers the first event, returns `202 Accepted`, and enqueues a `dotloop_webhook_process` job. Verify the second returns `200 OK` and logs a duplicate ignore trace.
- **Worker Execution**: Verify the local queue worker automatically polls, transitions, and completes jobs.
- **Dead-Letter Recovery**: Force a worker failure, verify it registers under `dead_letter` status in the Admin dashboard, and execute a manual Retry trigger to verify reschedule queue routing.

---

## 3. Tenant Isolation & RBAC
- **Auth Guard Enforcement**: Confirm debug/demo endpoints return `401 Unauthorized` when requested without tokens in production.
- **Permission Checking**: Verify non-admin/non-owner accounts receive `403 Forbidden` on workspace launch/waiver actions.
