# Production Persistence Verification Report

This document reports on the shapework. database persistence layer architecture, configurations, and verification results in production-like environments.

---

## 1. Persistence System Analysis

* **Persistence Mode**: Hybrid in-memory cached state with local file fallback.
* **Active Storage Driver**: Configured via the `STORAGE_DRIVER` environment variable. Options: `'memory'`, `'local'`, or `'database'`.
* **Repository Architecture**: All data interfaces route to `MemoryRepository` (defined in `server/persistence/repositories.ts`). 
* **Storage Location**:
  * In `'local'` mode: Stored in `/data/db.json` in the project root.
  * In `'memory'` or `'database'` mode: Retained in server process memory only.

---

## 2. Server Restart Verification Results

| Persistence Metric | STORAGE_DRIVER='memory' | STORAGE_DRIVER='local' | STORAGE_DRIVER='database' |
| :--- | :---: | :---: | :---: |
| **Workspace Creation Persisted** | No | **Yes** (saved to db.json) | No |
| **Membership Persisted** | No | **Yes** (saved to db.json) | No |
| **Audit Trails Persisted** | No | **Yes** (saved to db.json) | No |
| **Survives Server Restart** | No | **Yes** | No |

---

## 3. High-Priority Risks

1. **Mocked Database Driver**:
   * *Critical*: Although `repositories.ts` checks for `SUPABASE_URL` and `SUPABASE_KEY` when `STORAGE_DRIVER` is set to `'database'`, the Supabase client is never actually instantiated. Memory collections are used instead, resulting in **complete data loss upon server restart**.
2. **Concurrent File-Writing Conflicts**:
   * *Warning*: Under `'local'` mode, the entire db state is serialized to a single `/data/db.json` file on every modification. Under high concurrent tenant loads, this will cause write bottlenecks and race conditions.

---

## 4. Final Recommendation

* **For Controlled Pilot**: Require `STORAGE_DRIVER=local` to ensure client data is saved.
* **For Self-Serve / Production**: Implement real client-to-database routing for the repositories before launching to customer self-serve.
