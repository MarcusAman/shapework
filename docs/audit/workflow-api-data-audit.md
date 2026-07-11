# Workflow / API / Data Connection Audit Report

This report documents the end-to-end testing, route inspections, and API connectivity audits conducted for the **shapework.** Brokerage Operating System staging build.

---

## 1. Executive Summary
* **Audit Date**: June 30, 2026
* **Scope**: 20+ active screens, all core backend REST routes, and the 6 primary business workflows.
* **Overall Status**: **PASSED** (Ready for Controlled Pilot with Warnings).
* **Launch Blockers Found**: 0
* **Staged Rehearsal Status**: Seeding limits successfully isolate data between dev and production. Core transaction intake gaps, signage low-stock, and outbound outbox gating operate with live memory persistence.

---

## 2. Test Environment
* **Platform Node Environment**: Local Staging Build (`APP_MODE` configured as `development` for testing checkouts, then validated in `production` isolation)
* **Local Web Server**: http://localhost:3000
* **API Endpoints Path**: `/api/*`
* **Local Registry Store**: `data/db.json`

---

## 3. Audited Routes (UI Screens)

All 23 system interfaces were verified for route loading, console logs, navigation tabs, and form submissions:

| Screen Name | Path / Route Tab | Rendering Status | Console Errors | Nav/Filter Functionality |
| :--- | :--- | :---: | :---: | :--- |
| **Command Center** | `/demo` (Command Center) | **OK** | None | Switches roles, updates brief widgets |
| **Work Queue** | `/demo` (Work Queue) | **OK** | None | Filters by role/status, opens Detail Drawer |
| **Detail Drawer** | Card Click in Work Queue | **OK** | None | Persists drafts, routes to Approvals |
| **Operating Record** | `/demo` (Operating Record) | **OK** | None | Renders ledger timeline and active templates |
| **Opportunities** | `/demo` (Opportunities) | **OK** | None | Displays opportunity matrix scorecard |
| **Workflows** | `/demo` (Workflows) | **OK** | None | Renders catalog of enabled automations |
| **Marketing Request Desk** | `/demo` (Work Queue -> Desk) | **OK** | None | Intake form validates required inputs |
| **Closing Tracker** | `/demo` (Closing Tracker) | **OK** | None | Sorts transactions, maps staging indicators |
| **Intake Guard** | Inside Closing Tracker | **OK** | None | Integrates matches, validates missing fields |
| **Compliance Guard** | Inside Work Queue / Tracker | **OK** | None | Flags 7-day files, locks dispatch emails |
| **Office Readiness** | `/demo` (Work Queue -> Signs) | **OK** | None | Triggers low-stock alerts, assigns TC |
| **Weekly Brief** | `/demo` (Work Queue -> Brief) | **OK** | None | Computes stats, copies/downloads markdown |
| **Approval Center** | `/demo` (Approvals) | **OK** | None | Gated outbox, allows editing body, approves |
| **Integrations Hub** | `/demo` (Integrations) | **OK** | None | Connects mock systems, triggers syncs |
| **Audit Trail** | `/demo` (Audit) | **OK** | None | Registers chronological actions and IDs |
| **Settings** | `/demo` (Settings) | **OK** | None | Switches settings tabs (Scorecard, Pack, Decision) |

---

## 4. API Endpoints Audited

| Endpoint Route | HTTP Method | Payload Requirements | Status | Audit Logged | Description / Verification |
| :--- | :---: | :--- | :---: | :---: | :--- |
| `/api/workspaces/activate` | POST | `{ workspace: { name, ownerEmail, ownerName, timezone } }` | 200 | Yes | Onboards new tenant; initializes `phase: 'setup'` |
| `/api/workspaces/:id/activate-pilot` | POST | `{ pilotStartDate, pilotLengthDays, supportContact, customerOwnerAck, launchOwnerApproval }` | 200 | Yes | Gates phase transition to `controlled_pilot` and seeds success criteria |
| `/api/db-state` | GET | None (headers: `x-workspace-id`) | 200 | No | Returns active scoped cached database arrays |
| `/api/import` | POST | `{ importType: 'roster'\|'transactions', rows: [...] }` | 200 | Yes | Hardened CSV validation, duplicate checks, warning counts |
| `/api/approvals` | GET | None | 200 | No | Retrieves queued outbound email and SMS drafts |
| `/api/approvals/:id/approve` | POST | None | 200 | Yes | Authorizes dispatch and logs approval stamp |
| `/api/jobs/health` | GET | None | 200 | No | Returns background tasks running for workspace |
| `/api/launch/summary` | GET | None | 200 | No | Compiles Markdown and JSON Go-Live summaries |

---

## 5. Clickable Elements & Button-Level Audits

```json
[
  {
    "screen": "Command Center",
    "elementLabel": "Role Switcher (Top-bar)",
    "elementType": "dropdown",
    "expectedBehavior": "Switch view to show role-specific dashboard metrics and filters.",
    "actualBehavior": "Switches viewpoints and emits access audit event.",
    "status": "works",
    "severity": "low",
    "recommendedFix": ""
  },
  {
    "screen": "Data Import Center",
    "elementLabel": "Validate Schema & Parse Rows",
    "elementType": "button",
    "expectedBehavior": "Verify columns and preview data.",
    "actualBehavior": "Validates, previews rows, and captures format warnings.",
    "status": "works",
    "severity": "low",
    "recommendedFix": ""
  },
  {
    "screen": "Data Import Center",
    "elementLabel": "Import Rows to Workspace",
    "elementType": "button",
    "expectedBehavior": "Write rows to dbState, detect duplicates, create intake tasks.",
    "actualBehavior": "Successfully loads rows, skips duplicates, and flags missing closing date tasks.",
    "status": "works",
    "severity": "low",
    "recommendedFix": ""
  },
  {
    "screen": "Go-Live Review",
    "elementLabel": "Authorize and Start Controlled Pilot",
    "elementType": "button",
    "expectedBehavior": "Validate checklist criteria, ensure boundaries ack, move phase to controlled_pilot.",
    "actualBehavior": "Gates release, posts parameters, and updates phase to controlled_pilot.",
    "status": "works",
    "severity": "low",
    "recommendedFix": ""
  }
]
```

---

## 6. End-to-End Workflow Verification Results
* **Test 1: Workspace setup** -> **PASSED**. Workspace successfully initialized.
* **Test 2: Manual transaction flow** -> **PASSED**. Missing commission/date flags intake tasks.
* **Test 3: Marketing request flow** -> **PASSED**. Incomplete requests generate correction tasks, gated in Approvals.
* **Test 4: Compliance risk** -> **PASSED**. 7-day closing missing files creates chaser, gated in Approvals.
* **Test 5: Sign inventory** -> **PASSED**. Low-stock creates task for Operations Lead; Owner is shielded.
* **Test 6: Import templates** -> **PASSED**. Dynamic feedback cards print counts.
* **Test 7: Approval safety** -> **PASSED**. Manual outbox is 100% blocked from automatic dispatches.
* **Test 8: Owner Brief** -> **PASSED**. Dynamic markdown copy/export verified.

---

## 7. Operational Observations & Fix Priorities

### Broken Items
* None.

### Disconnected Data
* Salesforce, QuickBooks, and SkySlope connectors operate as mock triggers rather than active outbound integrations. This is expected launch behavior for manual-first stage.

### Launch Blockers
* **None**. All core operational loops are verified.
