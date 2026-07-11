# workspace-onboarding-auth-flow.md

This document outlines the step-by-step onboarding, provision routing, and authorization setup sequence when activating a new workspace tenant in **shapework.**.

---

## 1. Onboarding API Sequence

```mermaid
sequenceDiagram
    participant Admin as Platform Admin
    participant Wizard as Onboarding Wizard
    participant API as Onboarding Route (/api/workspaces/activate)
    participant Database as PostgreSQL DB

    Admin->>Wizard: Submits Workspace Config (Name, Timezone, Owner Email, Staff TC)
    Wizard->>API: POST workspace configuration
    API->>API: Validate required configurations & active DB driver
    alt Validation Fails
        API-->>Wizard: 400 Bad Request
    else Validation Succeeds
        API->>Database: CREATE workspaces row (active, setup phase)
        API->>Database: CREATE owner user & transaction coordinator user (pending status)
        API->>Database: CREATE workspace_memberships linking users to workspace
        API->>Database: CREATE default operating_record for the workspace
        API->>Database: CREATE default manual writeback approval policies
        API->>Database: CREATE default inactive workflow templates
        API->>Database: Log "workspace onboarded" System Audit Event
        API-->>Wizard: 200 OK (Workspace Details)
    end
```

---

## 2. Invitation & Pending User State

In compliance with the customer pilot safety gate guidelines:
* **No Plaintext Session Keys**: Workspace creation does NOT generate a static/plaintext access key or auto-authenticated bearer session.
* **Pending Status**: The invited owner/coordinator records are flagged as `active` in the users registry but have `password_hash = null`.
* **Login Trigger**: The owner must navigate to the console login screen and sign in via email to generate a custom cryptographically verified session token.

---

## 3. Post-Activation Database Verification

To verify that the onboarding process correctly propagated all tables, check that the following records exist in PostgreSQL:
1. `workspaces`: Contains the newly created workspace slug (e.g. `acme-realty`).
2. `users`: Owner and TC profiles linked to their email addresses.
3. `workspace_memberships`: Roles assigned (e.g., `owner`, `transaction_coordinator`) mapped with correct permission scopes.
4. `operating_records`: Workspace blueprint initialized in the `discovery` status.
5. `approvals`: Outbound approval safeguards connections set to manual gating.
6. `workflow_templates`: Listing and Financing workflows seeded for the workspace.
