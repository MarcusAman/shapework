# First Customer Launch Runbook

This document details the operational cutover protocol to onboard, configure, and transition the first brokerage customer to LIVE status on the shapework. platform.

---

## 1. Onboarding Phase (T-5 to T-1 Days)
1. **Initialize Workspace Profile**: Run the Customer Onboarding Wizard to define brokerage parameters.
2. **Assign User Roles**: Map at least one `owner` and one `operations_lead` or `transaction_coordinator`.
3. **Set Launch Mode Strategy**:
   - `integration_first`: Full sync required before launch.
   - `manual_first`: Allow bypassing integration blockers to launch from roster/deals CSV imports.
4. **Link Integrations**:
   - Complete Rechat OAuth flow.
   - Generate API Nation Dotloop webhook token.

---

## 2. Launch Day Protocol
1. **Verify Diagnostics checks**: Verify readiness percentage is at 100% (or waivers applied).
2. **Apply Waivers for Non-Critical Blockers**: Non-critical blocks (like pending Rechat oauth keys in manual-first mode) can be waived via the Launch Readiness panel.
3. **Execute Go-Live Cutover**: Click the "Mark Workspace Active & Live" gate to transition database state to production status.
4. **Deploy Live Webhooks**: Direct API Nation webhook payloads to the verified opaque endpoint.
5. **Verify Audit Trail**: Confirm first post-launch workspace interactions append cleanly to the ledger.

---

## 3. Post-Launch Monitoring (First 48 Hours)
1. **Queue Inspection**: Open settings -> Admin Operations Dashboard to check background worker queue load.
2. **Handle Dead-Letter Jobs**: Trigger retries for any failed baseline imports or normalizer tasks.
3. **Deduplication Check**: Confirm duplicate webhook payloads receive an instant `200 OK` response code and register a single ignore audit note.
