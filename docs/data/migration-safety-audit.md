# Database Migration Safety Audit Report

This report evaluates schema versioning, index definitions, and idempotency guarantees of database migrations.

---

## 1. Migration Execution & Idempotency

* **Migration File**: `server/db/migrations/20260701000000_init_relational.sql`
* **Idempotency Strategy**: 
  * All table creations use the `CREATE TABLE IF NOT EXISTS` directive, ensuring that re-running migrations does not overwrite active data or crash.
  * Index creations use `CREATE INDEX IF NOT EXISTS`.
  * Column additions use `ADD COLUMN IF NOT EXISTS` to avoid duplicate column crashes.
  * Constraints use `ALTER COLUMN ... DROP NOT NULL` to safely modify columns.
* **Redeployment Safety**: Migrations run synchronously on server startup via `executeMigrations(pool)` inside `server/persistence/repositories.ts` before the server starts listening. If migrations fail, the server fails closed on boot.

---

## 2. Index Registry & Performance Optimization

To guarantee tenant isolation and speed up scoped queries, every workspace-bound entity table is index-mapped on its scoping columns:

* **Tenant Isolation Indexes**:
  * `idx_workspace_memberships_workspace_id ON workspace_memberships(workspace_id)`
  * `idx_transactions_workspace_id ON transactions(workspace_id)`
  * `idx_transaction_checklists_workspace_id ON transaction_checklists(workspace_id)`
  * `idx_workflow_templates_workspace_id ON workflow_templates(workspace_id)`
  * `idx_opportunities_workspace_id ON opportunities(workspace_id)`
  * `idx_quick_wins_workspace_id ON quick_wins(workspace_id)`
  * `idx_build_sprints_workspace_id ON build_sprints(workspace_id)`
  * `idx_work_items_workspace_id ON work_items(workspace_id)`
  * `idx_approvals_workspace_id ON approvals(workspace_id)`
  * `idx_audit_events_workspace_id ON audit_events(workspace_id)`
  * `idx_integration_connections_workspace_id ON integration_connections(workspace_id)`
  * `idx_role_ownership_workspace_id ON role_ownership(workspace_id)`
  * `idx_operating_records_workspace_id ON operating_records(workspace_id)`
  * `idx_pilot_success_criteria_workspace_id ON pilot_success_criteria(workspace_id)`

* **Application Performance Indexes**:
  * `idx_users_status ON users(status)`
  * `idx_transactions_expected_closing_date ON transactions(expected_closing_date)`
  * `idx_work_items_status ON work_items(status)`
  * `idx_audit_events_created_at ON audit_events(created_at)`
