# Automation & Safeguards Policy

This document defines the governance rules, risk categories, confidence thresholds, and approval protocols enforced by **shapework.** to prevent automated side-effects in production environments.

## 1. Operational Risk Classification

### A. Low-Risk: Auto-Safe Internal Updates
Low-risk actions are internal updates to database checklist items, calendar syncing, and internal logging that do not execute outbound messaging or sign files:
* Syncing photographer schedule dates to internal calendar loops.
* Updating checklist check-offs for internal staging (e.g. "disclosures uploaded").
* Auto-generating draft email reminders in the coordinator’s outbox.
* **Default Policy:** Allowed automatically if `confidence >= 85%`.

### B. Medium-Risk: Review Required
Medium-risk actions are internal deal stage transitions, roster updates, or integration credential resets:
* Updating transaction stage (e.g. from "inspection" to "closing_prep").
* Assigning deal files between transaction coordinators.
* Flagging a property as "blocked" due to structural contingencies.
* **Default Policy:** Requires validation check in the **Operations Inbox** or **Command Center**.

### C. High-Risk: Explicit Approval Required
High-risk actions are external client/agent communications, API state mutations, or document signatures:
* Dispatching outbound SMS secure links containing checklist reminders to roster agents.
* Transmitting escrow confirmation emails to co-op brokerages or title officers.
* Writing status overrides back to CRM systems of record (e.g. Dotloop).
* **Default Policy:** Never automated in sandbox or production. Requires explicit broker/COO double-key authorization.

## 2. Confidence & Safety Thresholds

```
Confidence Score [0% - 100%]
  ↓
  ├── [85% - 100%]: Processed as Auto-Safe / Staged Draft (depending on Risk category)
  ├── [70% - 84%]: Sent to Human-in-the-Loop Review Queue for manual matching
  └── [0% - 69%]: Flagged as Exception; matching rejected, alerts logged
```

## 3. Rollback & Undo Rules

Every automated action must record the exact state metadata before execution:
* Before value (e.g., `current_stage: "inspection"`)
* After value (e.g., `current_stage: "closing_prep"`)
* When rollback is triggered by an authorized administrator:
  1. The target record is reverted to the "before" value.
  2. The integration connector updates the connected platform.
  3. A compensating audit entry is recorded in the activity ledger.
