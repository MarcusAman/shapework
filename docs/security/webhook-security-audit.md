# Webhook Security Audit

This document audits webhook verification, idempotency logic, and integration safety for all external integrations.

---

## 1. Webhook Signature Verification
* **Rechat**: Enforces signature verification check using HMAC-SHA256 headers (`x-rechat-signature`). If the signature doesn't match the configured client key or the sandbox token, the endpoint fails with `401 Unauthorized`.
* **Dotloop/API Nation**: Relies on OAuth verification and TLS origin validation checks.
* **Demo/Test routes**: Webhook verification remains strict; unauthenticated webhook requests are immediately rejected.

---

## 2. Replay and Idempotency Protections
* Webhook requests include an `eventId` or `uuid` in the payload.
* The system checks the database to confirm if the event ID was already processed.
* If a duplicate event ID is detected, the event is immediately discarded with `200 OK` (suppressed), preventing duplicate work or double processing.

---

## 3. Human-in-the-Loop Gating
* Incoming webhooks **never** trigger external writes or state changes directly.
* Webhooks instead create **Action Proposals** in the Approvals Center.
* Operators must log in and explicitly approve the action before shapework performs any writebacks or messaging.
* Every approved or rejected webhook attempt is recorded in the central audit ledger.
