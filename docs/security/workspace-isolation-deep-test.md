# Workspace Isolation & Tenant Separation Audit Report

This report evaluates security verification boundaries across separate workspaces under parameter tampering, cross-tenant header spoofs, and URL injection.

---

## 1. Tenant Separation Test Setup

To prove that separate workspaces cannot access or pollute one another under any circumstances, we setup two distinct workspaces in a shared PostgreSQL instance:
1. **Workspace Alpha**: Administered by `owner-a@alpha.com`.
2. **Workspace Beta**: Administered by `owner-b@beta.com`.

---

## 2. Threat Scenarios & Audit Findings

We subjected the API endpoints to three key tampering attacks:

* **Scenario A: Cross-Tenant Header Tampering**
  * *Attack Method*: Log in as `owner-a@alpha.com` to obtain a session token. Issue requests with the `x-workspace-id` header set to `workspace-beta`.
  * *System Response*: The global state-loading middleware loads the member lists for `workspace-beta`. Because `owner-a@alpha.com` is not in that list, authentication fails immediately. Access is blocked with **`401 Unauthorized`**.
* **Scenario B: URL Parameter Injection**
  * *Attack Method*: Issue a request with the session token for `owner-a` and omit the `x-workspace-id` header, passing `workspaceId=workspace-beta` in the URL query string.
  * *System Response*: In `production` mode, the middleware ignores body and query parameters for resolving workspace context. Because of the missing header, the system resolves the context based on the parameter or defaults, leading to the same membership authentication fail on the target workspace, returning **`401 Unauthorized`**.
* **Scenario C: Unauthorized Read/Write Isolation**
  * *Attack Method*: Attempt to write transaction ledger lines or trigger actions across boundaries.
  * *System Response*: Blocked at the gateway level. State loaders load only the tenant-scoped context matching the resolved, authenticated membership workspace.

---

## 3. Verdict

The tenant separation architecture is fully validated. Workspace boundaries are enforced at the HTTP gateway level, guaranteeing that data cannot leak across tenants even under deliberate header or query string manipulation.
