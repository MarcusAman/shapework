# DB State Side Effect Audit

This document audits the side effects of `GET /api/db-state` on database state, performance, and pilot readiness, highlighting key risks and detailing our remediation plan.

---

## 1. Current State Evaluation

- **What `/api/db-state` reads**:
  - Entire workspace configuration (organization, settings, profiles, agents, integrations)
  - Work Queue active items, action proposals, audit log ledger, transactions, compliance files, sign inventories, and office supplies lists.
- **What `/api/db-state` mutates (Prior to Sprint Hardening)**:
  - Invokes `syncOpportunitiesToWorkItems` on every GET/read fetch.
  - Automatically appends missing role gaps, low supply items, and transactions checklist alerts directly to the database.
  - Automatically persists the mutated state to disk (`data/db.json` or database tables).

---

## 2. Risk Identification

### Dynamic Work Item Duplication
GET/read requests are meant to be idempotent. Running sync logic during a read call risks adding duplicate tasks if ID mapping is non-deterministic (e.g. including timestamps) or if multiple users load the page concurrently.

### Hidden State Mutations
Merely opening the dashboard triggers state changes and updates `updatedAt` timestamps in the background, making it difficult to trace which user or API write action created a task.

### Performance Degradation
As the list of transactions, listings, and audit history grows, running a full scan and persisting data on every single page navigation will cause severe memory and database write-lock performance issues.

### Audit Log Ledgers Gaps
Background sync items that are created/modified on GET requests do not cleanly associate with the active session user, leaving gaps in security logs.

---

## 3. Remediation & Hardening Plan

1. **Purely Read-Only GET Endpoint**: Refactor `/api/db-state` to strictly return data without executing opportunity synchronization or writing to disk.
2. **Dedicated Evaluator Route (`POST /api/workflows/evaluate`)**:
   - Create a dedicated workflow evaluation route.
   - Run the synchronization logic strictly inside this write endpoint, which can be explicitly called by the frontend or triggered automatically on backend write events.
3. **Deterministic ID Keys**: Map all synced tasks to deterministic keys (e.g. `transaction:{transactionId}:missing_source`) to guarantee idempotency and prevent duplicate generation.
4. **Clean Resolution & Reopening**: Ensure resolved issues automatically change status to `completed` with audit entries, while re-detected issues transition back to `pending`.
5. **Workspace Isolation**: Restrict evaluation rules to only scan records matching the authorized workspace context (`wsId`).
