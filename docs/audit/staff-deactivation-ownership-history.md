# Staff Deactivation Ownership History Audit

## Objectives
Verify that deactivating a staff member correctly soft-deactivates the user profile, preserves history for all completed tasks (historical accountability), and removes or reassigns any active pending work items.

## Rules Applied
- **Completed Tasks**: No changes to `assignedStaffMemberId` or `assignedOwnerName` on completed items.
- **Active Tasks**: Automatically clears or reassigns pending work items previously owned by the deactivated staff member.
- **Audit Logs**: Deactivation actions trigger high-priority audit logs detailing the actor, target user, and impacted tasks.

## Verification Status
- **E2E Test File**: [staff-deactivation-history.spec.ts](file:///Users/marcusaman/Downloads/shapework%20(2)/tests/e2e/staff-deactivation-history.spec.ts)
- **Status**: PASSED
