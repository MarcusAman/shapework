# Route Inventory — Customer vs. Internal Separation

This document inventories and classifies all existing application routes, sidebar tabs, and views to prepare for the structural division between the customer-facing console, shapework internal operator console, and sales demo space.

---

## 1. Route Classification Matrix

| Path / Tab | Current View / Component | Target Audience | Target Route | Action | Risk |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`/`** | `PublicHome` | Public Website | `/` | Keep public | Low |
| **`/method`** | `PublicMethod` | Public Website | `/method` | Keep public | Low |
| **`/brokerages`** | `PublicBrokerages` | Public Website | `/brokerages` | Keep public | Low |
| **`/operational-intelligence`** | `PublicIntelligence` | Public Website | `/operational-intelligence` | Keep public | Low |
| **`/discovery`** | `PublicDiscovery` | Public Website | `/discovery` | Keep public | Low |
| **`/request-discovery`** | `PublicDiscoveryRequest` | Public Website | `/request-discovery` | Keep public | Low |
| **`/about`** | `PublicAbout` | Public Website | `/about` | Keep public | Low |
| **`/field-notes`** | `PublicFieldNotes` | Public Website | `/field-notes` | Keep public | Low |
| **`/link/:id`** | `SecureActionLinks` | Customer Users | `/link/:id` | Keep as secure action link | Low |
| **`/demo`** | `WorkspaceConsole` (demo mode) | Sales Leads / Demos | `/demo` | Limit to `/demo` only | Low |
| **`/app`** | `WorkspaceConsole` | Brokerage Customers | `/app` | Cleanse & serve as main console | Medium |
| **`/internal`** | *None (new)* | shapework Admins/Operators | `/internal` | **[NEW]** Setup internal route group | Medium |

---

## 2. Tab & Sidebar Sub-View Classification

### Customer-Facing Tab Views (`customer_app` target)
These screens belong in `/app` and represent standard brokerage operations:
* **Command Center / Today**: Executive operating summary showing daily briefs, risk counts, and stuck items.
  * *New Tab Name*: `Today`
  * *Intended Route*: `/app`
  * *Key Components*: [MorningBriefing](file:///Users/marcusaman/Downloads/shapework%20(2)/src/components/command/MorningBriefing.tsx)
* **Work Queue**: Staff list of all tasks.
  * *Intended Route*: `/app/work-queue`
  * *Key Components*: [WorkQueue](file:///Users/marcusaman/Downloads/shapework%20(2)/src/components/layout/WorkQueue.tsx)
* **Transactions**: Active closing pipelines.
  * *Intended Route*: `/app/transactions`
  * *Key Components*: [TransactionsView](file:///Users/marcusaman/Downloads/shapework%20(2)/src/components/transactions/TransactionsView.tsx)
* **Compliance**: Missing document audits and signature verification tasks.
  * *Intended Route*: `/app/compliance`
  * *Key Components*: [ClosingComplianceGuard](file:///Users/marcusaman/Downloads/shapework%20(2)/src/components/transactions/ClosingComplianceGuard.tsx)
* **Marketing Requests**: Intake requests for listing flyers, agent bios, and collateral.
  * *Intended Route*: `/app/marketing`
  * *Key Components*: [MarketingRequestDesk](file:///Users/marcusaman/Downloads/shapework%20(2)/src/components/workflows/MarketingRequestDesk.tsx)
* **People & Ownership**: human staff directory and responsibility maps.
  * *New Tab Name*: `People & Ownership`
  * *Intended Route*: `/app/people`
  * *Key Components*: [AgentOnboardingBoard](file:///Users/marcusaman/Downloads/shapework%20(2)/src/components/people/AgentOnboardingBoard.tsx)
* **Office & Signage**: Signs checklist, Facilities checklists, and closing gifts inventory.
  * *New Tab Name*: `Office & Signage`
  * *Intended Route*: `/app/office`
  * *Key Components*: [OfficeReadinessSignInventory](file:///Users/marcusaman/Downloads/shapework%20(2)/src/components/workflows/OfficeReadinessSignInventory.tsx)
* **Approvals**: Approval gate queue for reminders and system updates.
  * *Intended Route*: `/app/approvals`
  * *Key Components*: [ApprovalCenter](file:///Users/marcusaman/Downloads/shapework%20(2)/src/components/approvals/ApprovalCenter.tsx)
* **Owner Brief**: Weekly briefings and metric reports.
  * *Intended Route*: `/app/owner-brief`
  * *Key Components*: [WeeklyOwnerBrief](file:///Users/marcusaman/Downloads/shapework%20(2)/src/components/command/WeeklyOwnerBrief.tsx)
* **Integrations**: Customer connection toggles.
  * *Intended Route*: `/app/integrations`
  * *Key Components*: [IntegrationsHub](file:///Users/marcusaman/Downloads/shapework%20(2)/src/components/integrations/IntegrationsHub.tsx)
* **Audit**: Historical timeline log.
  * *Intended Route*: `/app/audit`
  * *Key Components*: [LiveOperationsTimeline](file:///Users/marcusaman/Downloads/shapework%20(2)/src/components/live/LiveOperationsTimeline.tsx), [ActivityAuditTrail](file:///Users/marcusaman/Downloads/shapework%20(2)/src/components/command/ActivityAuditTrail.tsx)
* **Settings**: Simplified workspace/brokerage settings panel.
  * *Intended Route*: `/app/settings`
  * *Key Components*: [DataImportCenter](file:///Users/marcusaman/Downloads/shapework%20(2)/src/components/settings/DataImportCenter.tsx)

### Internal Delivery Tab Views (`internal_shapework` target)
These screens belong in `/internal` and represent shapework's onboarding tools:
* **Workflow Discovery**: Intake reports, current-state flowmaps, and discovery lists.
  * *Intended Route*: `/internal/discovery`
  * *Key Components*: [DiscoveryPrioritiesView](file:///Users/marcusaman/Downloads/shapework%20(2)/src/components/settings/DiscoveryPrioritiesView.tsx)
* **Operational Priorities**: Scoreboards for opportunities.
  * *Intended Route*: `/internal/opportunities`
  * *Key Components*: [DiscoveryPrioritiesView](file:///Users/marcusaman/Downloads/shapework%20(2)/src/components/settings/DiscoveryPrioritiesView.tsx)
* **Build Plans**: Sprints planning and templates scope details.
  * *Intended Route*: `/internal/build-plans`
  * *Key Components*: [CustomerLaunchWizard](file:///Users/marcusaman/Downloads/shapework%20(2)/src/components/settings/CustomerLaunchWizard.tsx)
* **Customer Launch**: Checklists and launch runbooks.
  * *Intended Route*: `/internal/customer-launch`
  * *Key Components*: [FirstBrokeragePilotChecklist](file:///Users/marcusaman/Downloads/shapework%20(2)/src/components/settings/FirstBrokeragePilotChecklist.tsx), [CustomerLaunchRoom](file:///Users/marcusaman/Downloads/shapework%20(2)/src/components/settings/CustomerLaunchRoom.tsx)
* **Pilot Readiness**: Scorecards checking system counts and compliance values.
  * *Intended Route*: `/internal/pilot-readiness`
  * *Key Components*: [PilotReadinessScorecard](file:///Users/marcusaman/Downloads/shapework%20(2)/src/components/settings/PilotReadinessScorecard.tsx)
* **Launch Decision**: Human override/ready approval panels.
  * *Intended Route*: `/internal/launch-decision`
  * *Key Components*: [PilotLaunchDecisionPanel](file:///Users/marcusaman/Downloads/shapework%20(2)/src/components/settings/PilotLaunchDecisionPanel.tsx), [FirstPilotLaunchPack](file:///Users/marcusaman/Downloads/shapework%20(2)/src/components/settings/FirstPilotLaunchPack.tsx)
* **QA & Test Engine**: Simulator triggers and connector sandboxes.
  * *Intended Route*: `/internal/qa`
  * *Key Components*: [IntegrationTestConsole](file:///Users/marcusaman/Downloads/shapework%20(2)/src/components/settings/IntegrationTestConsole.tsx)

---

## 3. Deprecated & Hidden Elements

* **COO Focus (AICOOMissions)**: Remove from customer app console.
* **Agent Operations Simulator (AIAgentWorkforce)**: Hide from customer app. Place in Internal admin console.
