# Data Model Migration & Legacy Consolidation

This document details the architecture, schema updates, data mappings, and migration strategy implemented to consolidate Shapework's operational model around the **Headless Runtime Contract** as the single source of truth.

---

## 1. Objectives

- **Consolidate Entities**: Transition Shapework from duplicate local state arrays to 10 unified, database-backed runtime collections.
- **Conform Write Paths**: Enforce that all new jobs, steps, signals, decisions, and approvals are written directly to the conformed runtime.
- **Ensure Backwards Compatibility**: Implement a dynamic adapter projecting runtime entities back to legacy structures (`workItems`, `actionProposals`, `quickWins`, etc.) to support older display views.
- **Enable Dual-Storage Driver Support**: Support both local JSON storage (`db.json`) and PostgreSQL storage modes seamlessly.
- **Maintain Idempotent Migrations**: Provide a boot-time migration service to safely bootstrap legacy databases to the new runtime schema without generating duplicate records.

---

## 2. Conformed Runtime Collections (10 Core Entities)

The runtime is centered on the following 10 schema collections:

1. **Signals**: Captured raw inbound triggers (webhook payloads, parsed emails).
2. **Decisions**: Evaluated triage decisions determining if a signal requires automation.
3. **Shapework Jobs**: The top-level workflow orchestration execution thread.
4. **Shapework Job Steps**: Step-by-step actions executed sequentially within a Job.
5. **Approvals**: Human-in-the-loop validation gates before executing sensitive external operations.
6. **Actions**: Operational write-backs, email transmissions, or database updates triggered by steps.
7. **Deliveries**: Tracking telemetry for action execution (e.g. SMTP receipts, API callbacks).
8. **Outcomes**: Summaries of completed work or decisions registered by Shapework.
9. **Receipts**: Customer-facing audit logs of completed automation.
10. **Owner Brief Items**: Shielding deflection logs and decisions bubbled up to the executive cockpit.

---

## 3. Database Schema Mapping (PostgreSQL / JSON)

To ensure that both JSON and PostgreSQL drivers support the same collections, the schema definition was added to the db-sync system (`server/persistence/dbSync.ts`) using standard `pg` mappings.

| State Collection (CamelCase) | SQL Database Table (Snake_Case) | Key Mappings & Serialization |
|---|---|---|
| `signals` | `signals` | `id`, `workspace_id`, `source_type`, `source_name`, `signal_type`, `title`, `summary`, `safe_payload_summary`, `created_at` |
| `decisions` | `decisions` | `id`, `workspace_id`, `signal_id`, `decision_type`, `status`, `triage_notes`, `created_at` |
| `shapeworkJobs` | `shapework_jobs` | `id`, `workspace_id`, `signal_id`, `workflow_key`, `workflow_name`, `request_text`, `status`, `current_step`, `human_review_required`, `owner_worthy`, `created_at`, `updated_at`, `completed_at` |
| `shapeworkJobSteps` | `shapework_job_steps` | `id`, `job_id`, `step_index`, `title`, `description`, `assigned_role`, `requires_approval`, `status`, `action_type`, `action_payload`, `approved_by`, `approved_at`, `created_at`, `updated_at` |
| `approvals` | `shapework_approvals` | `id`, `workspace_id`, `job_id`, `step_id`, `approval_type`, `title`, `summary`, `recipient_role`, `recipient_display`, `channel`, `draft_action_summary`, `risk_level`, `what_could_go_wrong`, `status`, `approved_by`, `approved_at`, `created_at` |
| `actions` | `shapework_actions` | `id`, `workspace_id`, `job_id`, `step_id`, `action_type`, `payload`, `status`, `created_at`, `executed_at` |
| `deliveries` | `shapework_deliveries` | `id`, `workspace_id`, `action_id`, `channel`, `recipient`, `delivery_status`, `error_message`, `sent_at` |
| `outcomes` | `shapework_outcomes` | `id`, `workspace_id`, `job_id`, `title`, `summary`, `category`, `hours_saved`, `created_at` |
| `receipts` | `shapework_receipts` | `id`, `workspace_id`, `job_id`, `title`, `summary`, `url`, `created_at` |
| `ownerBriefItems` | `owner_brief_items` | `id`, `workspace_id`, `source_type`, `source_id`, `title`, `summary`, `category`, `priority`, `created_at` |

> [!NOTE]
> Database keys are automatically transformed from camelCase to snake_case on insertion, and from snake_case back to camelCase on query retrieval using `TABLE_MAPPINGS` serializers.

---

## 4. Idempotent Migration Service (`migrationService.ts`)

The `server/headless/migrationService.ts` contains two core components:

1. **Boot Migration (`migrateLegacyToRuntime`)**:
   - Loops over legacy `workItems` and maps them to `shapeworkJobs` and `shapeworkJobSteps`.
   - Loops over legacy `actionProposals` and maps them to `approvals`.
   - Uses unique prefix identifiers (e.g. `job_migrated_{legacy_id}`, `approval_migrated_{legacy_id}`) to ensure that running the migration multiple times is idempotent.
2. **Runtime Projection Adapter (`syncRuntimeToLegacy`)**:
   - Automatically runs during the state persistence cycle (`persistState`).
   - Translates current active runtime `shapeworkJobs`, `approvals`, `ownerBriefItems`, and `receipts` back into legacy arrays (`workItems`, `actionProposals`, `quickWins`, `shapeworkOutputs`) so legacy dashboards render correctly.

---

## 5. Front-End View Refactoring

- **Workspace & Demo Consoles**: Expanded `useWorkspaceConsoleState.ts` and `useDemoConsoleState.ts` hooks to manage and fetch the 10 runtime collections from the backend.
- **Workboard / Work Queue**: Configured `WorkQueue.tsx` to construct visual items directly from `shapeworkJobs` and `shapeworkJobSteps` rather than the legacy `workItems` array.
- **Approvals Tab**: Configured `ApprovalCenter.tsx` to read pending approvals directly from `approvals` and route confirmation events through the unified `/api/shapework/jobs/steps/:id/approve` API.
- **Owner Brief Tab**: Refactored `WeeklyOwnerBrief.tsx` to derive all metrics, deflections, and completed wins from the conformed `ownerBriefItems`, `shapeworkJobs`, and `receipts` state.
