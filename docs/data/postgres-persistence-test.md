# PostgreSQL Persistence & Recovery Verification

This report documents findings from the programmatic recovery and persistence tests simulating server crash, redeployment, and configuration cycles.

---

## 1. Test Methodology

The verification plan simulates a real-world deployment cycle where the application server process crashes or is restarted due to a new software release while retaining active sessions and client data.

1. **Initialize Server A**: Boot a master server process on Port `3019` in production mode pointing to the test PostgreSQL instance.
2. **Setup Tenant & Seed**: Perform workspace activation, creating a tenant profile (`Persistence Test Brokerage`) and an operator account (`persistence-owner@brokerage.com`).
3. **Establish Session**: Issue a POST login request, retrieving a valid `shapework_session` JWT cookie.
4. **Mutate State (Write Data)**: Submit a transaction record payload for `789 Woodlawn Ave` with expected commission `13500`.
5. **Crash Simulation**: Kill the Server A process (`SIGTERM`) abruptly.
6. **Deploy Server B (Recovery)**: Spin up a fresh server process on Port `3021` utilizing the same database pool.
7. **Verify Retrieval (Read Data)**: Request the workspace state from Server B using the session token.

---

## 2. Recovery Findings

* **Database Persistence**: The transaction record created in Server A was written to the PostgreSQL relational `transactions` table.
* **Redeployment Handover**: Server B successfully processed the request, decoded the JWT session cookie, loaded the scoped workspace state from PostgreSQL, and returned the `789 Woodlawn Ave` transaction record containing the exact parameters:
  * `clientName: 'Jane Doe'`
  * `revenue: 13500`
* **Verdict**: Relational persistence is fully validated. The application successfully decoupled transient state from the local runtime environment, allowing full survivability across server crashes and rolling deploys.
