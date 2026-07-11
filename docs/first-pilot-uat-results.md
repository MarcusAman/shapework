# First Pilot UAT Results

This document records the verification results of executing the UAT scenarios outlined in `/docs/first-pilot-uat-scenarios.md` in a fresh `First Brokerage Pilot Rehearsal` workspace using generic sample data.

---

## Executive Summary
* **Date of Rehearsal**: June 30, 2026
* **Environment**: Local Staging Build (`production` mode checked)
* **Workspace Tested**: `First Brokerage Pilot Rehearsal` (Workspace ID: `first-brokerage-pilot-rehearsal`)
* **Total Scenarios**: 7
* **Passed Scenarios**: 7
* **Failed Scenarios**: 0
* **Launch Blockers Remaining**: 0

---

## Scenario Execution Log

### Scenario 1: Manual-first workspace setup
* **Status**: **PASS**
* **Steps Completed**:
  1. Opened settings tab and accessed the Customer Onboarding Wizard.
  2. Defined workspace name: `First Brokerage Pilot Rehearsal` and selected `manual_first` mode.
  3. Mapped team roles under the Command Center (Sarah Jenkins as Owner, Alex Carter as Operations Lead, Emma Watson as TC, Robert Vance as Marketing Coordinator).
  4. Switched active roles in the top-bar profile selector.
* **Blockers Found**: None.
* **Expected Result**: Persists workspace config, adapts dashboards according to role, and registers Audit event.
* **Actual Result**: Dashboard adapts cleanly. Interrupted count displays correctly under roles.
* **Fix Required**: No.

### Scenario 2: Import active transactions
* **Status**: **PASS**
* **Steps Completed**:
  1. Loaded Settings -> Organization Data Controls.
  2. Copied the active transactions template text.
  3. Pasted CSV data stream in the text area.
  4. Validated columns and parsed rows (parsed 3 transaction rows successfully).
  5. Selected **Import 3 Rows to Workspace**.
  6. Verified items registered in the Closing Tracker.
  7. Re-imported the exact same CSV stream to test duplicate filtering.
* **Blockers Found**: None.
* **Expected Result**: Active transactions register. Missing dates/commissions flag intake tasks in the Work Queue. Duplicate imports do not create duplicate items.
* **Actual Result**: 3 transactions loaded. Missing target closing date for Bruce Wayne escrow triggered a task card in the Work Queue. Second import filtered all 3 duplicates successfully.
* **Fix Required**: No.

### Scenario 3: Marketing request intake
* **Status**: **PASS**
* **Steps Completed**:
  1. Switched role to Marketing Coordinator.
  2. Submitted a request with incomplete flyer dimensions.
  3. Verification guard flagged the entry.
  4. Work Queue item generated.
  5. Opened detail drawer, drafted a correction email and clicked **Send to Approvals**.
  6. Switched to Owner profile, opened the Approval Center, and clicked **Approve & Dispatch**.
* **Blockers Found**: None.
* **Expected Result**: Item gates under Approval Center; status transitions to waiting; Weekly Brief updates with deflected task.
* **Actual Result**: Email draft was safely quarantined in Approval Center and only dispatched after Owner approval.
* **Fix Required**: No.

### Scenario 4: Closing compliance risk
* **Status**: **PASS**
* **Steps Completed**:
  1. Logged a transaction closing in 6 days under the Closing Tracker.
  2. Omitted compliance files.
  3. Compliance Guard flagged the transaction high-risk and generated a chaser task in the Work Queue.
  4. Sent chaser to approvals; approved in Approval Center.
* **Blockers Found**: None.
* **Expected Result**: Risk is flagged, duplicate alerts are blocked, and weekly brief tracks the risk event.
* **Actual Result**: Closing Compliance Guard flagged the item and prevented repeated duplicate alerts.
* **Fix Required**: No.

### Scenario 5: Office/sign issue
* **Status**: **PASS**
* **Steps Completed**:
  1. Under Office Readiness, checked out signs to push remaining quantity below threshold.
  2. Low-stock trigger created a task in the Work Queue assigned to Operations Lead.
  3. Switched to Owner role to verify owner dashboard did not show this low-stock alert (shielded).
  4. Switched back, resolved stock, and checked Weekly Brief for "avoided interruptions".
* **Blockers Found**: None.
* **Expected Result**: Alerts are routed to Operations Lead; Owner is shielded; deflected count increments.
* **Actual Result**: Owner Command Center remained quiet. Owner brief reflected 1 deflected interruption.
* **Fix Required**: No.

### Scenario 6: Weekly Owner Brief
* **Status**: **PASS**
* **Steps Completed**:
  1. Loaded the Weekly Brief tab.
  2. Verified compiled numbers (deflected hours, transactions closing, active gaps).
  3. Executed "Copy Brief" and "Download Brief".
* **Blockers Found**: None.
* **Expected Result**: Stats compile accurately; formatting is clean markdown; no private PII is leaked.
* **Actual Result**: Clean markdown exports. No client emails or phone numbers visible.
* **Fix Required**: No.

### Scenario 7: Approval safety
* **Status**: **PASS**
* **Steps Completed**:
  1. Switched to Marketing Coordinator.
  2. Simulated sending outbox dispatch.
  3. Verified system blocked direct dispatch and forced "Queue for Approval".
  4. Switched to Owner, edited details, and approved.
  5. Inspected Audit Trail for approval action.
* **Blockers Found**: None.
* **Expected Result**: All outbox dispatches are gated. Audit logs actor and edits.
* **Actual Result**: Outbox dispatches successfully locked in queue. Audit trail lists stamp details.
* **Fix Required**: No.
