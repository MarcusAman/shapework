# Console Separation Regression Check

## Objectives
Ensure absolute separation between `/app` (customer console), `/demo` (sales sandbox), and `/internal` (delivery cockpit). Prevent data leaks, cross-workspace membership spoofing, and unauthorized dev cockpit access.

## Access Rules Enforced
- **Multi-Tenant Scoping**: All API routes validate user membership against the requested workspace and return `403 Access Denied` on mismatch.
- **Console Boundaries**: The internal cockpit and its associated APIs require the `access_developer_tools` permission scope, preventing non-internal/standard customer users from gaining access.

## Verification Status
- **E2E Test File**: [console-separation-regression.spec.ts](file:///Users/marcusaman/Downloads/shapework%20(2)/tests/e2e/console-separation-regression.spec.ts) and [console-route-separation.spec.ts](file:///Users/marcusaman/Downloads/shapework%20(2)/tests/e2e/console-route-separation.spec.ts)
- **Status**: PASSED
