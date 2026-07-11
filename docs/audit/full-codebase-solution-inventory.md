# Shapework codebase solution inventory audit report

**Date**: July 8, 2026  
**Status**: Completed  
**Sprint**: Read-only solution audit  
**Auditor**: Antigravity AI  

---

## 1. Executive Summary
Shapework is an autonomous, headless brokerage operating layer designed to manage, deflect, and resolve standard operational workflows (signals, decisions, approvals, and actions) while presenting a clean "cockpit" UI to the brokerage owner and operations coordinators.

This audit cataloged all routes, UI surfaces, internal consoles, headless service structures, data models, simulated scenarios, action channels, integrations, safety settings, and testing resources to establish a clear baseline. We found significant capabilities already built, along with database-layer gaps and duplication between legacy tracking arrays (e.g. `workItems`, `actionProposals`, `shapeworkOutputs`) and the new unified headless contract arrays (e.g. `signals`, `decisions`, `shapeworkJobs`, `approvals`, `outcomes`).

---

## 2. Route Inventory

Below is the complete inventory of Express routes found in `server.ts`, `headlessActionRouter.ts`, `rechatRoutes.ts`, `apinationDotloopRoutes.ts`, `quickbooksRoutes.ts`, `googleRoutes.ts`, and `plannedIntegrationsRouter.ts`.

### Customer Brokerage App Routes (Front-End Routing in `App.tsx` & `CustomerAppRoutes.tsx`)
- **`/app`**
  - **File**: `CustomerAppRoutes.tsx`
  - **User**: Operations Coordinators, Broker Owner, Transaction Coordinators
  - **Purpose**: Main workspace cockpit (Workboard, Work Queue, Approvals, Owner Brief, Settings).
  - **Status**: Active.
  - **Security Concern**: Relies on JWT auth token matching. Ensures workspace isolation.

### Internal Shapework/Admin Routes (Front-End Routing in `App.tsx` & `InternalRoutes.tsx`)
- **`/internal`**
  - **File**: `InternalRoutes.tsx`
  - **User**: Shapework Platform Administrators (e.g. Platform Admin)
  - **Purpose**: Systems operations desk (Workspace management, webhook tracers, feature flags, developer test benches).
  - **Status**: Active.
  - **Security Concern**: Properly checks `access_developer_tools` permission scope or `'admin'` role on membership.

### Sales Demo Routes
- **`/demo`**
  - **File**: `DemoConsole.tsx`
  - **User**: Sales/Demo viewers
  - **Purpose**: Evaluates simulated real-estate pipelines with synthetic data.
  - **Status**: Active. Blocked in production mode (redirects to `/app`).

### Token/Action Portal Routes (Opaque External Access in `HeadlessPortals.tsx` & `headlessActionRouter.ts`)
- **`/client/deal/:token`**
  - **File**: `HeadlessPortals.tsx` -> `ClientDealPortal` / `headlessActionRouter.ts` -> `/client-portal/resolve/:token`
  - **User**: External Clients (e.g. home buyers/sellers)
  - **Purpose**: Upload documents (e.g. disclosures) and view transaction progress.
  - **Status**: Active.
  - **Security Concern**: Uses SHA-256 token hashing; resolves token hash to lookup transaction. In production, requires active token validation.
- **`/agent/action/:token`**
  - **File**: `HeadlessPortals.tsx` -> `AgentActionPortal` -> `/agent-portal/resolve/:token`
  - **User**: External Sub-Agents
  - **Purpose**: Secure action links to complete listing checklist items or upload documents without full login.
  - **Status**: Active. Matches token hash to verify access.
- **`/request/:type/:token`**
  - **File**: `HeadlessPortals.tsx` -> `SmartIntakeLink` -> `/intake/submit`
  - **User**: Agents
  - **Purpose**: Unauthenticated smart request intake forms (marketing design, office readiness, support).
  - **Status**: Active. Inserts `workItems` and evaluates Owner Shield deflection rules.
- **`/action/:token`**
  - **File**: `headlessActionRouter.ts` -> `/action/:token`
  - **User**: Operations staff, clients
  - **Purpose**: Resolves and retrieves active tokenized action details.
  - **Status**: Active.
- **`/unsubscribe/:token`**
  - **File**: `server.ts` -> `/unsubscribe/:token`
  - **User**: Email Recipients
  - **Purpose**: Records marketing unsubscribe events to ensure compliance.
  - **Status**: Active.

### API Routes
- **`/api/auth/login`**, **`/api/auth/logout`**, **`/api/auth/session`**, **`/api/auth/forgot-password`**, **`/api/auth/reset-password`**
  - **File**: `server.ts`
  - **User**: All Users
  - **Purpose**: Session management and password reset flows.
  - **Status**: Active. Uses rate limiters and secure token hashes.
- **`/api/db-state`**
  - **File**: `server.ts`
  - **User**: Authenticated Workspace Members
  - **Purpose**: Retrieves the unified in-memory database state for the active workspace.
  - **Status**: Active.
- **`/api/workflows/evaluate`**
  - **File**: `server.ts`
  - **User**: Operations staff
  - **Purpose**: Evaluates rules-based trigger mappings.
  - **Status**: Legacy/Duplicate. Retained for older workflow evaluations.
- **`/api/growth/*`**
  - **File**: `server.ts` -> `getGrowthRouter()`
  - **User**: Marketing coordinators
  - **Purpose**: Segment management, sending accounts, campaign logs, and compliance audits.
  - **Status**: Active.
- **`/api/notifications/*`**
  - **File**: `server.ts` -> `getNotificationRouter()`
  - **User**: Operations staff
  - **Purpose**: Lists notification history and sends manual triggers.
  - **Status**: Active. Used for audits and SMS provider logic.
- **`/api/headless/*`**
  - **File**: `server.ts` -> `getHeadlessActionRouter()`
  - **User**: Public/External / Auth staff
  - **Purpose**: Gateway to resolve action links, branding, client portals, webhooks, and AI triage classifications.
  - **Status**: Active.

### Webhook Routes
- **`/api/webhooks/resend`**
  - **File**: `server.ts`
  - **User**: Resend Event Gateway
  - **Purpose**: Handles bounce, complaint, and delivery events from the email provider.
  - **Status**: Active. Enforces Svix signature verification.
- **`/api/webhooks/zapier/:workspaceId/:secret`**
  - **File**: `server.ts`
  - **User**: Zapier
  - **Purpose**: Handles external incoming automated actions.
  - **Status**: Stubbed.
- **`/api/integrations/apination/dotloop/webhook/:webhookToken`**
  - **File**: `apinationDotloopRoutes.ts`
  - **User**: API Nation Dotloop Gateway
  - **Purpose**: Process loop modifications, signatures, and document triggers.
  - **Status**: Active. Validates tokens, checks idempotency keys, and queues parsing jobs.
- **`/api/integrations/rechat/webhook/:webhookToken`**
  - **File**: `rechatRoutes.ts`
  - **User**: Rechat Event Gateway
  - **Purpose**: Process transaction events.
  - **Status**: Active.

### Dev/Demo-Only Routes
- **`/api/shapework/demo/trigger-scenario`**
  - **File**: `server.ts`
  - **User**: Demo/Developer
  - **Purpose**: Clears past jobs, injects demo seeds, starts simulation loops.
  - **Status**: Active. Blocked if `APP_MODE === 'production'`.
- **`/dev/notification-preview`** / **`/admin/notification-preview`**
  - **File**: `HeadlessPreviewGallery.tsx`
  - **User**: Developers / Staff
  - **Purpose**: Renders real-time email templates, SMS previews, and variables.
  - **Status**: Active. In production, requires `NOTIFICATION_PREVIEW_TOKEN` query verification.

---

## 3. UI / Product Surface Inventory

Below is an audit of the brokerage dashboard cockpit tabs (compiled from `CustomerAppRoutes.tsx`).

### Workboard
- **What is Real**: Displays active opportunities, listings, and transaction pipelines. Includes the "Guided Scenario Control Panel" (dev/demo mode only).
- **What is Mock**: Underneath columns, transactions are seeded statically.
- **Data Source**: `state.transactions`, `state.listings`, `state.opportunities`.
- **Verdict**: Keep. It serves as the primary visual tracker of deals.

### Work Queue (Context Rail)
- **What is Real**: Displays automated tasks that are assigned to team roles (Transaction Coordinator, Operations Lead, Marketing Coordinator).
- **What is Mock**: The completion buttons mutate `dbState.workItems` status to `'completed'`.
- **Data Source**: `state.workItems`.
- **Verdict**: Overlaps with the new unified `shapeworkJobs` steps. We should merge and align this queue to render active job steps rather than manual `workItems`.

### Approvals
- **What is Real**: Renders pending outbound communications, dispatch emails, or courier instructions. Gated by `<ApprovalPreviewModal>`.
- **What is Mock**: Approving simulated steps resolves and triggers subsequent stubs.
- **Data Source**: `state.approvals` (unified) and `state.actionProposals` (legacy).
- **Verdict**: Keep. Needs legacy `actionProposals` removed to read strictly from `state.approvals`.

### Owner Brief
- **What is Real**: Lists "Pending Owner Decisions" (active approvals), "Deflected Inquiries" (interception rules logs), and completed tasks.
- **What is Mock**: Rollup metrics (hours saved, tasks automated) are computed from in-memory arrays.
- **Data Source**: `state.ownerBriefItems`.
- **Verdict**: Keep. This is the primary owner value dashboard.

### Settings
- **What is Real**: Forms for editing brokerage branding (primary color, logo), webhook endpoint configurations, and notification rule preferences.
- **What is Mock**: Saving persists to storage via `persistState()`.
- **Data Source**: `state.branding`, `state.webhookEndpoints`, `state.staffPreferences`.
- **Verdict**: Keep. Essential configuration plane.

---

## 4. Internal Console Inventory

Below is an audit of the admin console (`/internal` via `InternalRoutes.tsx`).

- **System Overview**
  - *Purpose*: Renders global events stream, system health status, and resource usage metrics.
  - *Internal-only*: Yes.
- **Workspaces**
  - *Purpose*: Renders and provisions multi-tenant workspace records.
  - *Internal-only*: Yes.
- **Integration Health**
  - *Purpose*: Displays connection status, last sync timestamp, and error count for QuickBooks, Rechat, Dotloop, Google Workspace, and Microsoft 365.
  - *Internal-only*: Yes.
- **Webhook Delivery**
  - *Purpose*: Audit logs for outbound webhook deliveries (e.g. SVIX retry counts, payloads, responses).
  - *Internal-only*: Yes.
- **Notification Diagnostics**
  - *Purpose*: Diagnostic panel to inspect email delivery logs, SMS queue, allowlists, and send test logs.
  - *Internal-only*: Yes.
- **Voice Provider Diagnostics**
  - *Purpose*: Renders Retell and ElevenLabs credentials check.
  - *Internal-only*: Yes.
- **Action Token Registry**
  - *Purpose*: Security monitor displaying active hash tokens, expirations, and access audit counts.
  - *Internal-only*: Yes.
- **Security & Audit**
  - *Purpose*: Displays read-only system audit trails, logins, role escalations, and data exports.
  - *Internal-only*: Yes.
- **Support Console**
  - *Purpose*: Renders helpdesk ticket logs and tenant assistance tools.
  - *Internal-only*: Yes.
- **Feature Flags**
  - *Purpose*: Toggles runtime policies like `ENABLE_AUTO_TRIAGE`, `REQUIRE_DOUBLE_APPROVALS`.
  - *Internal-only*: Yes.
- **Pilot Readiness**
  - *Purpose*: Renders success checklist scorecards before transitioning workspaces to production.
  - *Internal-only*: Yes.

---

## 5. Headless Runtime Inventory

Below is an audit of the runtime backend contract services located in `server/headless/`.

### [runtimeTypes.ts](file:///Users/marcusaman/Downloads/shapework%20(2)/server/headless/runtimeTypes.ts)
- **Purpose**: Standardizes structural interfaces for all 10 runtime contract entities.
- **Status**: Production-ready.

### [signalsService.ts](file:///Users/marcusaman/Downloads/shapework%20(2)/server/headless/signalsService.ts)
- **Purpose**: Creates and push-appends incoming triggers to `dbState.signals`.
- **Main Export**: `createSignal()`
- **Status**: Active. Simple array push utility.

### [decisionService.ts](file:///Users/marcusaman/Downloads/shapework%20(2)/server/headless/decisionService.ts)
- **Purpose**: Evaluates a `Signal` against triage policies to formulate a `Decision`.
- **Main Export**: `evaluateSignal()`
- **Status**: Active. Uses deterministic rule matches (e.g., `RULE_RYAN_SHIELD_ROUTING`, `RULE_COMPLIANCE_GATE_REQUIRED`). Production-ready for rules routing.

### [jobPlannerService.ts](file:///Users/marcusaman/Downloads/shapework%20(2)/server/headless/jobPlannerService.ts)
- **Purpose**: Decodes a `Decision` and plans a linear array of `ShapeworkJobStep` objects. Provisions step approvals.
- **Main Export**: `createJobPlan()`
- **Status**: Active. Uses seeded step timelines (e.g., Google Review Engine, Compliance Chase). Production-ready template mapper.

### [approvalService.ts](file:///Users/marcusaman/Downloads/shapework%20(2)/server/headless/approvalService.ts)
- **Purpose**: Manages human approval gate status and triggers the downstream step action dispatcher upon approval.
- **Main Exports**: `createApproval()`, `approveApproval()`
- **Status**: Active. Integrates with the Owner Brief.

### [actionDispatchService.ts](file:///Users/marcusaman/Downloads/shapework%20(2)/server/headless/actionDispatchService.ts)
- **Purpose**: Handles simulated action execution (e.g., mock emails, SMS, API calls), creates delivery log receipts, and fires step-completion callbacks.
- **Main Exports**: `dispatchActionForStep()`, `setOnStepCompleted()`
- **Status**: Stubbed. Setups mock delivery responses via a 100ms timeout.

### [outcomeService.ts](file:///Users/marcusaman/Downloads/shapework%20(2)/server/headless/outcomeService.ts)
- **Purpose**: Handles step completed events. Completes jobs, creates receipts, syncs with legacy outputs (`dbState.shapeworkOutputs`), and logs wins to the Owner Brief.
- **Main Export**: `createOutcomeForStep()`
- **Status**: Active. Handles finalization.

### [ownerBriefService.ts](file:///Users/marcusaman/Downloads/shapework%20(2)/server/headless/ownerBriefService.ts)
- **Purpose**: Appends executive rollup items to `dbState.ownerBriefItems`.
- **Main Export**: `createOwnerBriefItem()`
- **Status**: Active.

---

## 6. Data Model Inventory

We analyzed all data collections in the system.

| Collection Name | Fields Used | Lifecycle Status | Duplicate / Overlap | Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| **`signals`** | `id`, `workspace_id`, `source_type`, `title`, `summary`, `safe_payload_summary`, `received_at` | **Current** | Overlaps with legacy `integrationEvents` | Retain. Deprecate legacy event logs. |
| **`decisions`** | `id`, `workspace_id`, `signal_id`, `decision_type`, `confidence`, `rules_triggered`, `rationale_summary` | **Current** | None | Retain. |
| **`shapeworkJobs`** | `id`, `workspace_id`, `status`, `workflow_key`, `workflow_name`, `confidence`, `owner_worthy` | **Current** | Overlaps with legacy `workItems` | Retain. Migrate legacy workItems to Jobs. |
| **`shapeworkJobSteps`**| `id`, `job_id`, `step_order`, `title`, `description`, `channel`, `status`, `requires_approval` | **Current** | Overlaps with legacy `tasks` | Retain. |
| **`approvals`** | `id`, `job_id`, `step_id`, `title`, `recipient_display`, `draft_action_summary`, `risk_level`, `status` | **Current** | Overlaps with legacy `actionProposals` | Retain. Deprecate `actionProposals`. |
| **`actions`** | `id`, `job_id`, `step_id`, `action_type`, `channel`, `recipient_display`, `status`, `provider` | **Current** | None | Retain. |
| **`deliveries`** | `id`, `action_id`, `channel`, `provider`, `delivery_status`, `attempt_count`, `last_attempt_at` | **Current** | None | Retain. |
| **`outcomes`** | `id`, `job_id`, `step_id`, `action_id`, `outcome_type`, `title`, `summary`, `follow_up_required` | **Current** | None | Retain. |
| **`receipts`** | `id`, `job_id`, `outcome_id`, `title`, `summary`, `action_taken`, `source_workflow` | **Current** | Overlaps with legacy `shapeworkOutputs` | Retain. Deprecate `shapeworkOutputs`. |
| **`ownerBriefItems`** | `id`, `workspace_id`, `source_type`, `source_id`, `title`, `summary`, `category`, `priority` | **Current** | Overlaps with legacy `quickWins` | Retain. |
| **`workItems`** | `id`, `type`, `title`, `ownerRole`, `priority`, `status`, `relatedId` | **Legacy** | Overlaps with `shapeworkJobs` | Deprecate. Map queue to Jobs instead. |
| **`actionProposals`** | `id`, `title`, `proposedAction`, `status`, `createdAt` | **Legacy** | Overlaps with `approvals` | Deprecate. |
| **`shapeworkOutputs`** | `id`, `title`, `summary`, `action_taken`, `outcome` | **Legacy** | Overlaps with `receipts` | Deprecate. |

---

## 7. Workflow Inventory

The following table summarizes the implementation status of all seeded workflows.

1. **Google Review Engine**
   - *Trigger*: closed status event.
   - *Signal/Decision/Job*: Planned & generated.
   - *Steps*: 4 steps (Verify closing -> Locate contact -> Draft invite -> Send email).
   - *Approval*: None (Auto-dispatch).
   - *Audit/Brief*: Logs receipt and brief completed work item.
   - *Simulation*: Fully simulated. Completes email dispatch automatically.

2. **Compliance Chase Engine**
   - *Trigger*: missing disclosures event.
   - *Signal/Decision/Job*: Planned & generated.
   - *Steps*: 3 steps (Audit checklist -> Locate LBP form -> Draft compliance email).
   - *Approval*: Step 3 requires approval by `compliance_partner`.
   - *Audit/Brief*: Prompts owner decision on the brief. Resumes step simulation upon approval.
   - *Simulation*: Fully simulated.

3. **Owner Interruption Shield (Ryan Shield)**
   - *Trigger*: routine supplies or signage email signal.
   - *Signal/Decision/Job*: Deflects immediately.
   - *Steps*: 3 steps (Intercept inquiry -> Verify criteria -> Route to Steve Schram).
   - *Approval*: None.
   - *Audit/Brief*: Logs "Owner Interruption Avoided" deflection record on Owner Brief.
   - *Simulation*: Fully simulated.

4. **Office Readiness**
   - *Trigger*: Lockbox/sign inventory depletion signal.
   - *Signal/Decision/Job*: Planned & generated.
   - *Steps*: 2 steps (Verify inventory -> Dispatch courier SMS).
   - *Approval*: None.
   - *Audit/Brief*: Logs win on the brief.
   - *Simulation*: Fully simulated.

5. **Marketing Request Intake**
   - *Trigger*: Smart Intake form submission.
   - *Signal/Decision/Job*: Planned & generated.
   - *Steps*: 3 steps (Validate intake -> Download photos -> Route to design desk).
   - *Approval*: None.
   - *Audit/Brief*: Logs completed work.
   - *Simulation*: Fully simulated.

---

## 8. Action Channel Inventory

- **`email`**: Partially Implemented. Uses a mock stub in development and test environments, but maps to a real `ResendEmailProvider` utilizing the `RESEND_API_KEY` in production environment.
- **`sms`**: Stubbed. Logs SMS payloads to stdout (`DevLogProvider`) or checks against allowlist (`SMS_TEST_ALLOWLIST`).
- **`action_link`**: Active. Generates secure external URLs using random token hashes.
- **`webhook`**: Active. Dispatches signed payloads with SVIX HMAC signatures.
- **`source_update`**: Stubbed. Mutates db state (e.g. updating listing or transaction status).
- **`voice`**: Not Implemented. Voice channel stubs exist in diagnostics UI but lack backend implementation.
- **`internal_route`**: Active. Mutates owner role assignments.

---

## 9. Integration Inventory

### Implemented & Active
- **Google Workspace (OAuth, Calendar, Gmail)**: Active. Communicates with `googleapis`. Syncs calendar events to create signals and work queue items. Supports OAuth refresh/access token logic.
- **API Nation (Dotloop webhook gateway)**: Active. Maps loop updates, validates token paths, checks webhook signatures, and triggers jobs.
- **Rechat**: Active. Webhook endpoints and event payload verifications.
- **QuickBooks**: Active. Syncs accounting files and logs invoices.
- **Resend**: Active. Used for actual transactional email dispatch.

### Planned / Stubs (UI Only or 501 Return)
- **Plaid**, **Zapier**, **Google Business Profile**, **SMTP Gateway**, **Twilio (SMS)**, **Retell (Voice)**, **ElevenLabs (Voice)**.

---

## 10. Demo / Simulation Inventory
- **Demo Seed Files**: `server/fixtures/` and `server/persistence/growthSeed.ts` seed synthetic portfolios on startup.
- **Trigger Scenario Endpoint**: `POST /api/shapework/demo/trigger-scenario` allows developers to trigger Compliance Chase, Google Review, or Ryan Shield scenarios. It is protected by environment checks:
  ```typescript
  const isProduction = process.env.APP_MODE === 'production' || process.env.NODE_ENV === 'production';
  if (isProduction) {
    return res.status(403).json({ error: 'Forbidded in production' });
  }
  ```
- **Active Intervals**: Background simulation loop `simulateJobSteps` handles asynchronous ticks (completing steps after 100ms actions finish). Timers are mapped to Job IDs in `activeIntervals` map and cleared upon completion/blocking.

---

## 11. Security / Safety Inventory

### Current Controls
1. **Opaque Token Paths**: Portals use `crypto.randomBytes(32)` tokens stored as SHA-256 hashes. DB lookups match hashes rather than raw tokens.
2. **Access Control (RBAC)**: Enforces role permissions (e.g. `manage_integrations`, `approve_actions`) on API routes.
3. **Webhook Signatures**: Outbound webhooks dispatch with SVIX timestamp headers to prevent replay attacks.
4. **Environment Isolation**: The `/demo` workspace and trigger endpoints are blocked when `APP_MODE === 'production'`.
5. **PII Masking**: Headless action audit logs mask email formats (e.g., `s***@nest-demo.local`).

### Gaps
- In PostgreSQL mode, the new headless runtime entities are not mapped in `TABLE_MAPPINGS` (meaning they aren't persisted to the database).
- Notification previews lack robust CSRF protection checks on get requests.

---

## 12. Test Inventory

There are **104 E2E test files** in `tests/e2e/`.

### Key Verified Files
- **`headless-runtime-contract.spec.ts`**: Verifies the entire Signal -> Decision -> Job -> Steps -> Action -> Receipt loop.
- **`headless-all.spec.ts`**: Tests allowlists, SMS dev log providers, and triage accuracy.
- **`demo-truth-pass.spec.ts`**: Verifies the control panels and UI drawer trace links.

### Recommended Testing Cadence
- **Every Build**: Run fast regression suite (including `headless-runtime-contract.spec.ts` and `auth-route-guards.spec.ts`).
- **Before Staging Release**: Run all 104 Playwright E2E integration specs.

---

## 13. Documentation Inventory
The `/docs/audit` folder contains **90 audit files** generated during incremental sprint check-ins.
- **Stale Docs**: Older documents referencing early monolithic console models (e.g., `customer-vs-internal-opportunity-scope.md`) are stale.
- **Current Docs**: `headless-operator-cockpit-v1.md` and `headless-runtime-contract-v1.md` reflect the current state.

---

## 14. Duplication / Overbuild Risks

1. **State Duplication**: `actionProposals` (legacy approvals) vs `approvals` (unified contract). Both are maintained in `dbState`.
2. **Queue Duplication**: `workItems` (legacy dashboard queue) vs `shapeworkJobs` + `steps` (unified contract).
3. **Outbound Logging Duplication**: `shapeworkOutputs` (legacy completions) vs `outcomes` + `receipts` (unified contract).
4. **Brief Duplication**: `quickWins` (legacy brief list) vs `ownerBriefItems` (unified brief list).

---

## 15. Verdict & Recommended Next Sprint

### Verdict
The headless runtime contract backend structure is **extremely well built and complete**. However, it is operating on top of legacy UI/data model duplicates. Writing new features before cleaning these up would lead to a highly convoluted state.

### Recommended Next Sprint: Data Model Migration & Legacy Consolidation
We recommend focusing the next sprint on cleaning up the data layer.
- **Why**:
  - The new headless runtime entities (`signals`, `decisions`, `jobs`, `approvals`, `receipts`, etc.) are currently transient or stored locally in `db.json`. They are not synchronized to PostgreSQL in `'database'` storage driver mode.
  - The UI and server still synchronize duplicate arrays (e.g. `actionProposals` and `shapeworkOutputs`) to maintain backward compatibility with old routes.
  - Consolidating these ensures that Shapework operates on a single source of truth across both memory, JSON, and PostgreSQL storage adapters.
