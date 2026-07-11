# Pilot Blocker Log

This log lists all identified operating issues, warnings, and verification tasks for the first brokerage pilot launch.

### Severity Categories
* `launch_blocker`: Blocks deployment. Must be resolved before pilot start.
* `high`: Affects core loop; requires mitigation.
* `medium`: Operational annoyance; workarounds exist.
* `low`: Minor display/functional issues.
* `polish`: Small UI adjustments.

---

## Active Issues

### 1. Webhook Integrations Not Connected (Manual-First Mode)
* **Severity**: `high` (Mitigated)
* **Description**: Third-party webhook pipelines (Dotloop, Rechat) are inactive by default when a fresh workspace is initialized.
* **Mitigation**: The system is designed manual-first. A brokerage operator can complete 100% of the daily operating loops using CSV imports and the manual dashboard screens.
* **Resolution**: Warning remains active in the Launch Decision Console until API OAuth tokens are supplied.

---

## Resolved Issues

### 1. Sandbox/Demo Jargon in Production UI
* **Severity**: `launch_blocker`
* **Resolution**: Replaced all user-facing references to "Sandbox CSV Test Templates" and "sandbox database" with "Customer Import Templates" and "Workspace Cache" in settings and go-live review screens.
* **Status**: **RESOLVED**

### 2. Missing Support SLA Disclaimers
* **Severity**: `high`
* **Resolution**: Created Support Boundaries manual and integrated clear links directly on the Integrations Hub and Settings pages.
* **Status**: **RESOLVED**
