# Action Proposal Hardening Audit

This document audits the security controls gating `/api/action/propose` and approvals routing, verifying that sensitive background actions cannot bypass human-in-the-loop authorization.

---

## 1. Route Gating and Session Security

- **Authentication Enforcement**: Every request to `/api/action/propose` requires a valid session cookie, verified by `requireAuth`.
- **Workspace Membership Validation**: Requests must verify the user's workspace membership context through `requireWorkspaceMembership`. Cross-tenant posting (supplying a mismatched workspaceId) is blocked, enforcing strict workspace boundaries.
- **Role Permissions Check**: Approving or dismissing proposals requires the `approve_actions` or `manage_work_queue` permission, enforced via `requirePermission`.

---

## 2. Proposal Payload Controls

- **No Direct Execution**: The `propose` route writes state changes to `awaiting_approval` inside the `actionProposals` collection. It does not run background processes or transmit external API calls directly.
- **Deterministic Approvals Mapping**: Proposed actions map to database records. Approving an action via `POST /api/action/approve` retrieves the draft directly from the database, executing the payload exactly as edited and logged.
- **Audit Trails**: Every proposal submission and approval action triggers an event in `dbState.auditEvents` detailing the active profile actor name, role, timestamp, and target property impact.
