# Work Item Resolution and Reopening Rules

This document outlines the deterministic transition rules for generated operational tasks, detailing how work queue items automatically resolve when issues are cleared and reopen when anomalies recur.

---

## 1. Core Transition Lifecycle

Generated work items transition automatically based on data signal states:
- **Active Signal** (Anomaly detected) $\rightarrow$ **Pending/Reopened Task** in Work Queue.
- **Cleared Signal** (Anomaly resolved) $\rightarrow$ **Completed Task** in Work Queue (archived from Today and Owner Brief views).

---

## 2. Transition Rules by Opportunity Area

### Missing Transaction Source
- **Deterministic ID**: `transaction:{transactionId}:missing_source`
- **Resolution**: Triggered when the transaction record's `referral_source` (or `referralSource`) is updated with a non-empty string.
- **Action**: Marks the task `completed`, logs an audit entry (`Resolved Work Queue item: ...`), and removes it from Today and Owner Brief rollups.
- **Reopen**: If the field is cleared or deleted, status transitions back to `pending`.

### Missing Expected Commission
- **Deterministic ID**: `transaction:{transactionId}:missing_commission`
- **Resolution**: Triggered when the transaction expected commission value is greater than 0.
- **Action**: Marks the task `completed`, logs audit, and updates rollups.

### Compliance Documents Chase
- **Deterministic ID**: `transaction:{transactionId}:task:{taskId}:missing_document`
- **Resolution**: Triggered when the associated task's status changes from `pending`/`missing` to `completed` or `approved`.
- **Action**: Marks the task `completed`, logs audit, updates Compliance page and Owner Brief views.
- **Reopen**: Reopens if a document is rejected or marked as `action_required`/`missing` again.

### Vacant Key Role Gaps
- **Deterministic ID**: `role:{roleId}:vacant_owner`
- **Resolution**: Triggered when a profile matching the role (e.g. `marketing_coordinator`) with status `active` is detected, or the role is assigned in the responsibility definitions.
- **Action**: Marks the task `completed`, logs audit, and clears the alert badge from Today.

### Signage & Office Supply Low Stock
- **Deterministic ID**: `office:{itemId}:low_stock` (or `office:sign_inventory:{signId}:low_stock`, `office:office_supplies:{supplyId}:low_stock`)
- **Resolution**: Triggered when sign inventory count (total - checkedOut) rises above `lowStockThreshold`, or supply status changes to `In Stock`.
- **Action**: Marks the task `completed`, logs audit, and updates signage stats.
- **Reopen**: Reopens if inventory levels drop below thresholds again.
