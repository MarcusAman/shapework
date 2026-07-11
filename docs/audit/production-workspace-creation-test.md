# Production Workspace Onboarding Test Report

This document reports on the workspace onboarding and activation validation results under simulated production environments.

---

## 1. Test Methodology

The onboarding and workspace setup validation was performed programmatically and via browser automation under the following environment:
* `APP_MODE=production`
* `STORAGE_DRIVER=local`
* `DATABASE_URL=mongodb://localhost:27017`
* `AUTH_PROVIDER_CONFIGURED=true`

---

## 2. Onboarding Verification Metrics

| Onboarding Step / Check | Expected Behavior | Actual Behavior | Result |
| :--- | :--- | :--- | :---: |
| **Console Entry Route** | Navigating to `/demo` redirects to `/app`. | Redirected cleanly to `/app`. | **PASS** |
| **Passcode Access Gate** | Access requires input of `shapework2026`. | Granted access on correct input. | **PASS** |
| **Workspace Activation** | POST to `/api/workspaces/activate` with owner details. | Returns 200 OK and registers tenant. | **PASS** |
| **User/Membership Creation**| Registers the owner (`owner@prod.co`) in the workspace. | Membership added to users database. | **PASS** |
| **Data Scope Integrity** | `/api/db-state` returns 200 for active tenant. | Returns 200 with scoped transactions. | **PASS** |
| **Audit Log Generation** | Activation triggers a system audit logging event. | Audit entry created in the ledger. | **PASS** |
| **Sandbox Hygiene** | Rehearsal/Demo data is filtered out on startup. | Zero rehearsal/demo workspaces loaded. | **PASS** |
| **Seeded Token Rejection** | Seeded tokens like `token_usr_sarah` fail auth. | Returns 401 Unauthorized. | **PASS** |

---

## 3. Onboarding Payload Spec Used

```json
{
  "workspace": {
    "name": "My Prod Workspace",
    "ownerEmail": "owner@prod.co",
    "ownerName": "Owner User",
    "timezone": "America/New_York"
  },
  "staff": {
    "transactionCoordinator": "tc@prod.co"
  }
}
```
* **Resolved Tenant Workspace ID**: `my-prod-workspace`
* **Persisted Owner ID**: `usr_owner_<timestamp>`
