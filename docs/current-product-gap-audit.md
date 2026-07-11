# shapework. Current Product Gap Audit

This gap audit documents the disconnected components, missing database integrations, state persistence gaps, and terminology inconsistencies discovered in the shapework. platform before product tightening.

## 1. Disconnected Components & State Gaps

### A. Marketing Request Desk
- **Gaps**: Renders a local `queue` state array. Submitting a new marketing request updates only local React state and does not post to the backend or create a task in the central Work Queue.
- **Action**: Connect forms to an API endpoint that adds a `WorkItem` of type `"marketing_request"`, scopes it to the current workspace, creates an audit event, and registers it in the database.

### B. Pipeline / Closing Tracker
- **Gaps**: Relies on a local `deals` React state array. Manual entry and CSV imports do not save transactions to the backend `dbState.transactions` table, nor do they create corresponding work items for compliance gaps.
- **Action**: Save manually entered or imported transaction items to the backend `/api/operating-record/transaction/create` and trigger validation rules.

### C. Transaction Intake Guard
- **Gaps**: Works on a local static `intakes` array. Actions like "Log File" or "Verify" change only local UI flags and do not register a transaction, task, or audit event.
- **Action**: Bind this view directly to transactions with status `onboarding` or outstanding `transaction_intake_gap` work items.

### D. Closing Compliance Guard
- **Gaps**: Renders static `ComplianceItem` arrays. Toggling checkoffs or drafting chasers is completely local and does not update backend records or trigger approval gates.
- **Action**: Bind checkoffs to live checklist tables and ensure agent/lender nudges are sent to the Approval Center before any action is completed.

### E. Weekly Owner Brief
- **Gaps**: Displays local static metrics and resolved lists. Avoided owner interruptions and active escrow compliance risks are mocked rather than calculated from active transactions and work items.
- **Action**: Compute stats dynamically by scanning the unified `dbState.workItems`, `dbState.opportunities`, and `dbState.auditEvents`.

### F. Office Readiness & Signage
- **Gaps**: Sign checkouts, supply stock toggles, and maintenance issue logs are client-only and reset on refresh.
- **Action**: Connect signage and supply checkouts to workspace-scoped collections in the database.

### G. Work Queue
- **Gaps**: Pulls from mixed arrays (`state.decisions`, `state.communications`, `state.actionProposals`) instead of reading from a unified, database-backed `WorkItem` model.
- **Action**: Implement a standard database table/collection `workItems` and render it inside `WorkQueue.tsx` with filter tabs.

## 2. Terminology Inconsistencies
- **Problem**: UI text randomly alternates between "Deals" and "Transactions".
- **Action**: Ensure all user-facing headers, menus, tabs, and buttons use "Transaction" or "Closing", reserving "Deal" only for internal integration mappings (e.g., Rechat external payload adapters).

## 3. Redundant / Demo-Only Surfaces
- **Problem**: AI COO Missions, Email Intelligence, and generic sandbox reset screens are visible in production.
- **Action**: Hide or restrict deprecated pages from the primary navigation rail in production mode.
