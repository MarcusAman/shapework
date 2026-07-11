# External Action Safety & Webhooks Audit Report

This report documents findings from the E2E verification of integration safety, webhook verification, and human-in-the-loop gating guards.

---

## 1. Webhook Signature Verification

All external messaging webhook routes (including Rechat, API Nation Dotloop, etc.) enforce strict signature validation. 
- Webhooks must be signed utilizing **HMAC-SHA256** signatures generated with the shared webhook secret.
- Mismatched or missing signatures are immediately rejected with `401 Unauthorized` or `400 Bad Request`.
- Verification utilizes constant-time string comparison (`crypto.timingSafeEqual`) to prevent side-channel timing attacks.

---

## 2. Human-In-The-Loop (HITL) Gating

* **Writeback Safety**: Webhooks and background integration tasks are strictly forbidden from directly modifying transactions, changing listing statuses, or executing writebacks to external platforms (e.g. creating tasks or emails in Rechat/Dotloop).
* **Proposal Center Integration**: All detected events, data sync gaps, or recommended actions are mapped to an **Action Proposal** object and written to the database `approvals` table with status `'awaiting_approval'`.
* **Execution Flow**: Writebacks are executed *only* when an authorized workspace operator (e.g. `owner`, `admin`, or `operations_lead`) reviews the proposal and explicitly clicks the approve action, providing high-assurance gatekeeping.
