# Demo Sandbox vs. Production Deployment

This document contrasts the current local preview state of **shapework.** with the operational architecture required for enterprise production deployment.

## Sandbox Preview Environment
The active environment is a secure, client-side sandbox loaded with synthetic data for **Nest Realty**:
* All data is local, transient, and synthetic.
* Integrations are simulated connectors. Sync checks evaluate mock API heartbeats.
* Outbound messages (secure links, follow-up notifications) do not transmit to external servers. They are rendered visually in simulation frames.
* Operations are designed for interactive inspection and product flow audits.

---

## Production Deployment Requirements

Transitioning shapework. into a brokerage’s live operations layer requires the following architectural changes:

| Component | Sandbox Preview | Production Deployment |
| :--- | :--- | :--- |
| **Authentication** | Hardcoded demo profiles | SSO / Identity Providers, OAuth 2.0 PKCE auth flow |
| **Credential Storage** | Local memory state | Vault, AWS Secrets Manager, or encrypted environment files |
| **Email Ingestion** | Local array processing | Graph API webhooks, Gmail pub/sub, DKIM verify checks |
| **Write Capabilities** | In-memory mock databases | Direct REST endpoints in Dotloop, SkySlope, CRM systems |
| **Audit Ledger** | Client-side list | Immutable logging database (e.g. audit-table replica) |

## Production OAuth Config Checklist

To enable live write connections, the administrator must configure the following connector scopes:

### 1. Google Workspace Connector
* **Scopes:** `https://www.googleapis.com/auth/gmail.readonly`, `https://www.googleapis.com/auth/gmail.compose`, `https://www.googleapis.com/auth/calendar.events`
* **Purpose:** Process incoming agent/coordinator signals, draft follow-up templates in Outbox, and insert inspection deadlines on shared calendars.

### 2. Dotloop / SkySlope Connector
* **Scopes:** `loops.read`, `loops.write`, `files.read`, `checklists.write`
* **Purpose:** Audit compliance files, download disclosures, verify e-signatures, and auto-sync contract documents back to system folders.

### 3. CRM Connector (e.g. Rechat / Salesforce)
* **Scopes:** `deals.read`, `deals.write`, `contacts.read`
* **Purpose:** Fetch active buyer/seller profiles, update deal stages, and check workload volumes.
