# Customer Intake Form: Architectural & Operational Improvement Recommendations

During the hardening and pilot preparation sprint for the **shapework. brokerage app** (specifically tailored for Nest Realty), we identified critical gaps between the generic customer intake layout and the actual requirements for initializing a brokerage operating layer. 

To ensure faster onboarding, more deterministic data initialization, and immediate utility for future customer deployments, we recommend modifying the standard customer intake questionnaire and form structures.

---

## 1. Staff, Roles, and Operating Permissions
### Observed Gap
The initial intake lacked a clear distinction between **brokerage staff roles** (Operations Leads, Managing Brokers, Marketing Coordinators) and **agents**. This resulted in a generic "demo" user set rather than placing actual operational decision-makers in their respective roles.

### Intake Recommendations
* **Explicit Role Matrix**: The intake form must require customers to list initial staff members along with their primary operational roles (e.g., `ann@nestrealty` as Operations Lead, `melissa.gagliardi@nestrealty` as Marketing Coordinator, `james.fort@nestrealty` as Managing Broker).
* **Backup Routing Definitions**: Inquire upfront about backup responsibilities (e.g., "If the Marketing Coordinator is unavailable, who receives collateral review tasks?").
* **Staff Management Workflow**: Enable an admin UI field in the initial boilerplate for adding/editing operational staff, avoiding manual database seeding.

---

## 2. Integration Mapping & Tool Stack Hierarchy
### Observed Gap
The app assumed standard integrations (Rechat, Dotloop) but lacked a concrete mapping between their entities. For example, did transaction records originate from Rechat Deals or Dotloop Loops?

### Intake Recommendations
* **Primary Source of Truth (SOT) Declaration**: Ask the customer to explicitly declare the SOT for:
  1. Transactions (e.g., Rechat, Dotloop, or Lonewolf)
  2. Documents and Disclosures (e.g., Dotloop or DocuSign)
  3. Contact CRM (e.g., Rechat or Salesforce)
* **API Credentials & Sync Priorities**: Standardize fields asking for webhook-capable integration details and the frequency of syncs. Group them into:
  * **Priority 1**: Core Transaction/Document Sync (critical blockages)
  * **Priority 2**: Communications (Gmail/Outlook)
  * **Priority 3**: Marketing and Signage (Canva, local printers)

---

## 3. Marketing & Collateral Workflow Boundaries
### Observed Gap
The Marketing Request Desk initially operated as a general design intake queue. However, modern brokerages use self-serve portals (like the Rechat Design Center) for standard flyers/brochures, only escalating custom requests to coordinator queues.

### Intake Recommendations
* **Self-Serve Asset Definition**: Ask: "Which collateral assets should be generated via agent self-serve tools (e.g. Canva, Rechat Design Center)?"
* **FAQ / Deflection Input**: Pre-collect the URLs and instructions for these self-serve tools so they can be embedded directly in the agent-facing request desk to deflect simple requests.
* **Launch Timeline Parameters**: Standardize the collection of target lead times (e.g., "Photography scheduled $T-7$ days before launch", "Sign post installation requested $T-5$ days").

---

## 4. Compliance exception rules
### Observed Gap
Compliance systems typically require auditing every document, which introduces significant friction. The shapework operating model focuses on the *Exception-First Compliance Layer* (only flagging missing mandatory items within closing countdown windows).

### Intake Recommendations
* **Jurisdictional Document Requirements**: Request the minimum list of mandatory closing files (e.g., Virginia Property Disclosures, Escrow Receipts, Signed Agency Agreements).
* **Closing Alert Windows**: Ask the operations lead for their preferred alert frequency (e.g. T-30, T-14, T-7, T-3 countdown buckets) to auto-configure notifications.
