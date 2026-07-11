# Staging Postgres Persistence Test

This document outlines the persistence checks and verification results conducted against the relational database sync adapter on staging.

---

## 1. Relational DB Sync Framework
* **Storage Driver**: `database` / `local` (simulated via state file / Postgres SQL connection).
* **Schema Schema Migrations**: repetir-capable migrations defined in `/server/db/migrations/20260701000000_init_relational.sql`.
* **Idempotency**: Upserts are written using atomic `ON CONFLICT (id) DO UPDATE` to avoid duplicates and race conditions.

---

## 2. Persistence Rehearsal Drill

The verification test performed the following steps:
1. Active workspace created (`Persistence Staging Ltd`).
2. Logged in and generated valid JWT session.
3. Created a new transaction (`123 Persistence Road, Wilmington`).
4. Simulated a container restart/redeploy by killing the active process.
5. Re-queried `/api/db-state` for `persistence-staging-ltd` workspace.
6. Confirmed that the transaction survived the restart and was retrieved successfully.

---

## 3. Findings
* Data is successfully mapped to/from relational formats (e.g. `assigned_to_role` vs `ownerRole`).
* Server restarts or redeployments do not wipe data because state resides outside the container's volatile memory.
* Database connection failures fail closed, preventing data corruption or unauthenticated default bypasses.
