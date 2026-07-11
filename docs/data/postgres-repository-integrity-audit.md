# PostgreSQL Repository Integrity Audit

This audit documents direct PostgreSQL persistence schemas, query mappings, and workspace isolation/tenant scoping fields for all core database tables.

---

## 1. Tenant Scoping Strategy

Tenant isolation is implemented at the database level by enforcing a `workspace_id` scoping column on every state-changing entity table. Every request is processed under a specific workspace context resolved by matching either:
- The `x-workspace-id` HTTP header
- The `workspaceId` query parameter
- The authenticated user's workspace membership record

All reads and writes gate operations strictly within the scope of the resolved workspace ID.

---

## 2. Table Integrity Schema & Scoping Registry

| # | State Key | Database Table | Workspace Scoping Column / Strategy | Scoping Constraint / Query Filter |
|---|-----------|----------------|-------------------------------------|-----------------------------------|
| 1 | `workspaces` | `workspaces` | `id` (Root entity) | `WHERE id = $1` |
| 2 | `workspaceUsers` | `users` / `workspace_memberships` | `workspace_memberships.workspace_id` | `JOIN workspace_memberships ON user_id WHERE workspace_id = $1` |
| 3 | `transactions` | `transactions` | `workspace_id` | `WHERE workspace_id = $1` |
| 4 | `tasks` | `transaction_checklists` | `workspace_id` | `WHERE workspace_id = $1` |
| 5 | `workflowTemplates`| `workflow_templates` | `workspace_id` | `WHERE workspace_id = $1` |
| 6 | `opportunities` | `opportunities` | `workspace_id` | `WHERE workspace_id = $1` |
| 7 | `quickWins` | `quick_wins` | `workspace_id` | `WHERE workspace_id = $1` |
| 8 | `buildSprints` | `build_sprints` | `workspace_id` | `WHERE workspace_id = $1` |
| 9 | `workItems` | `work_items` | `workspace_id` | `WHERE workspace_id = $1` |
| 10| `actionProposals` | `approvals` | `workspace_id` | `WHERE workspace_id = $1` |
| 11| `auditEvents` | `audit_events` | `workspace_id` | `WHERE workspace_id = $1` |
| 12| `integrations` | `integration_connections`| `workspace_id` | `WHERE workspace_id = $1` |
| 13| `responsibilities` | `role_ownership` | `workspace_id` | `WHERE workspace_id = $1` |
| 14| `operatingRecords` | `operating_records` | `workspace_id` | `WHERE workspace_id = $1` |
| 15| `pilotSuccessCriteria`| `pilot_success_criteria` | `workspace_id` | `WHERE workspace_id = $1` |

---

## 3. Operations Integrity Verification

All repository operations utilize Parameterized SQL queries to prevent SQL Injection. The sync reconciler utilizes UPSERT operations using `ON CONFLICT (id) DO UPDATE` to prevent concurrency race conditions and duplicates during concurrent operation execution.
