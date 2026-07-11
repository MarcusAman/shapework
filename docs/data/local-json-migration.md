# local-json-migration.md

This document describes how to migrate legacy flat-file JSON state records from `data/db.json` into the production-ready PostgreSQL relational database.

---

## 1. Prerequisites

Before running the migration utility, ensure you have:
1. PostgreSQL service initialized and running on port `5432`.
2. `DATABASE_URL` configured in your `.env` environment file:
   ```bash
   DATABASE_URL="postgres://mock:mock@localhost:5432/mock"
   ```
3. A valid `data/db.json` file in the root directory containing the legacy state.

---

## 2. Migration Execution

To run the migration, execute the following script from the project root:

```bash
node scripts/migrate-local-json-to-database.mjs
```

### Script Execution Sequence

The migration utility executes the following steps:
1. **Connection Validation**: Verifies the connection to PostgreSQL and fails early if unreachable.
2. **Schema Initialization**: Reads and runs the SQL tables definition script `server/db/migrations/20260701000000_init_relational.sql`.
3. **Workspace Mapping**: Imports workspace configurations.
4. **User & Membership Resolution**: Resolves users, and creates memberships mapping roles and access scopes.
5. **Collection Population**: Loops through all standard list structures (`transactions`, `checklists`, `work_items`, `approvals`, `audit_events`, `role_ownership`, `sprints`, etc.), normalizes object keys to snake_case, and executes bulk upsert statements.

---

## 3. Post-Migration Integrity Checks

You can verify that the migration completed successfully by logging into the PostgreSQL command center (`psql`) and executing counts on the tables:

```sql
SELECT count(*) FROM workspaces;
SELECT count(*) FROM users;
SELECT count(*) FROM workspace_memberships;
SELECT count(*) FROM transactions;
SELECT count(*) FROM transaction_checklists;
SELECT count(*) FROM audit_events;
```
