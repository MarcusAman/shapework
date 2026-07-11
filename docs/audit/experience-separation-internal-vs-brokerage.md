# Product Boundary Audit: Internal Console vs. Brokerage App

This audit tracks the experience separation sprint, ensuring the Shapework Internal Console (`/internal`) and Brokerage Customer App (`/app`) are completely isolated.

---

## Route & Role Mapping Matrix

| Route Namespace | Intended User Persona | Gated Roles | UI Language Style | Data Visible |
| :--- | :--- | :--- | :--- | :--- |
| **`/internal`** | Shapework Engineers, Operators, Support | `shapework_operator`, `support_admin`, `developer`, `shapework_admin`, `implementation_lead` | Technical, Diagnostic, System-level | Raw JSON, Webhook Delivery IDs, IP Blocks, API credentials status, Feature Flags, Outbox diagnostics. |
| **`/app`** | Broker Owners, COOs, Staff | `owner`, `admin`, `operations_lead`, `transaction_coordinator`, `compliance_partner`, `listing_coordinator` | Plain English, Calm, Operations-focused | Deals, compliance exceptions, manual tasks, call logs, weekly owner briefs. |
| **`/action/:token`** | Agents, Clients, Third-parties | Anonymous (Token Authenticated) | Action-focused single task forms | Scoped task item (e.g. upload disclosures, confirm signing). |
| **`/demo`** | Sales prospects | Guest (Sales Mode) | Narrative walkthrough style | Seeded mock transaction decks, simulation triggers. |

---

## Safety Controls & Gating Enforcement

### 1. Cross-Workspace Data Leakage Protection
* Customer users on `/app` are locked to their own workspace dataset. No cross-tenant selection dropdowns or developer payloads are rendered.
* Internal operators on `/internal` can view multiple workspaces via the Workspace Detail registry selector, but these views are decorated with warning badges indicating system support impersonation modes.

### 2. Token Action Portals Isolation
* Token routes do not load navigation rails, topbars, or user profiles.
* Token authentication must resolve and match the database token registry before rendering sensitive entities.
* Expired or invalid tokens render a plain, safe fallback state with no system logs or developer diagnostic trace information.

### 3. Developer & Diagnostic Telemetry Cleanliness
* No raw webhook dispatch responses, Retell configuration variables, API keys, or database sync flags are exposed inside customer console tabs.
* The customer settings panel is restricted to whitelabel branding styles (colors, logos, and custom headers).
