# Full Playwright Test Inventory

This document details the test suite written to verify all security audits, console separation boundaries, and deactivation rules.

| Test Spec File | Target Verification | Status |
|---|---|---|
| [auth-consistency-cookie-session.spec.ts](file:///Users/marcusaman/Downloads/shapework%20(2)/tests/e2e/auth-consistency-cookie-session.spec.ts) | Verifies production cookie session enforcement and strict token bypass validation. | **PASSED** |
| [staff-crud-security.spec.ts](file:///Users/marcusaman/Downloads/shapework%20(2)/tests/e2e/staff-crud-security.spec.ts) | Verifies `manage_users` permission gate, email validation, restricted roles, and workspace limits. | **PASSED** |
| [customer-vs-internal-roles.spec.ts](file:///Users/marcusaman/Downloads/shapework%20(2)/tests/e2e/customer-vs-internal-roles.spec.ts) | Verifies internal roles are filtered out from the customer staff directory and select options. | **PASSED** |
| [staff-deactivation-history.spec.ts](file:///Users/marcusaman/Downloads/shapework%20(2)/tests/e2e/staff-deactivation-history.spec.ts) | Verifies soft-deactivation unassigns active tasks but preserves historical completed ones. | **PASSED** |
| [role-gap-side-effect-safety.spec.ts](file:///Users/marcusaman/Downloads/shapework%20(2)/tests/e2e/role-gap-side-effect-safety.spec.ts) | Verifies read-only `GET /api/db-state` is side-effect free and scanning is triggered strictly on write. | **PASSED** |
| [console-separation-regression.spec.ts](file:///Users/marcusaman/Downloads/shapework%20(2)/tests/e2e/console-separation-regression.spec.ts) | Verifies workspace access checks and cockpit developer tools permission restrictions. | **PASSED** |
| [comment-prefix-cleanup.spec.ts](file:///Users/marcusaman/Downloads/shapework%20(2)/tests/e2e/comment-prefix-cleanup.spec.ts) | Verifies double-slash headers are cleaned up from all customer-facing dashboard sections. | **PASSED** |

All tests have run serially under `workers=1` and passed successfully.
