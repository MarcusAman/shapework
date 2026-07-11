# Operator Experience Audit: Pilot Readiness

This audit evaluates the shapework. platform from the perspective of four target users at the first pilot brokerage: the **Brokerage Owner**, **Operations Lead**, **Transaction Coordinator (TC)**, and **Marketing Coordinator**.

---

## 1. Brokerage Owner (Executive Shield View)
* **What they need to see first**: 
  - Revenue summary (Pending commissions, risk-adjusted pipeline forecasts).
  - Gated decisions needing owner-level approvals (legal, large fee disputes).
  - The Weekly Brief detailing operational hours saved and shielded interruptions.
* **What they need to do daily**: 
  - Review and approve critical escalations (usually zero to one per day).
* **What they should NOT see**: 
  - Routine agent reminder tasks, missing marketing details, signage low-stock logs.
* **Language to avoid**: 
  - "Database registry," "idempotency keys," "webhook delivery," "JSON payload."
* **Missing action**: 
  - Direct quick-link to review risk files from the brief summary page.
* **Too technical**: 
  - Seeing active background jobs or simulator test console buttons.

---

## 2. Operations Lead (Command & Health View)
* **What they need to see first**: 
  - Active work item counts and SLA compliance warnings.
  - Active integration connections (system health status).
  - Office and sign inventories.
* **What they need to do daily**: 
  - Monitor overdue tasks and re-assign owners where appropriate.
  - Audit the system logs for compliance.
* **What they should NOT see**: 
  - Internal technical database indices or server route codes.
* **Language to avoid**: 
  - "Writeback target," "REST parameters," "session storage store."
* **Missing action**: 
  - Ability to quickly import roster lists via CSV manually during cutover.

---

## 3. Transaction Coordinator (Closing Ledger View)
* **What they need to see first**: 
  - Upcoming closings ledger, missing closing dates, and missing commission files.
  - Action items regarding compliance document gaps.
* **What they need to do daily**: 
  - Audit newly submitted contracts.
  - Dispatch document nudges to agents.
* **What they should NOT see**: 
  - Developer console outputs or system-level automation settings.
* **Language to avoid**: 
  - "idempotent verification," "scanned webhook endpoint," "parser payload."
* **Missing action**: 
  - Simple table filters to isolate files by "Missing Data" or "At Risk" stages quickly.

---

## 4. Marketing Coordinator (Collateral Desk View)
* **What they need to see first**: 
  - Pending design requests sorted by due date and property address.
  - Gaps (e.g. missing photo link, incomplete description).
* **What they need to do daily**: 
  - Process collateral (flyers, social graphics) and flag files ready for production.
  - Send clarification requests to agents.
* **What they should NOT see**: 
  - Legal disputes, closing commissions, transaction compliance audits.
* **Language to avoid**: 
  - "JSON schema mapping," "task processor queue," "ingest stream."
* **Missing action**: 
  - Agent-facing request form listing standard templates (Brochures, Event promotion).

---

## Screen-by-Screen Usability Assessment

| Screen | Target User | Key Friction / Technical Jargon | Resolution |
| :--- | :--- | :--- | :--- |
| **Command Center** | Owner / Ops Lead | Morning Brief contains "items needing attention" without role separation. | Split Command Center into role-specific views. |
| **Work Queue** | All Roles | No status tabs for "Needs Approval" or "Missing Info". | Implement a Filter Toolbar. |
| **Operating Record** | Owner | Lists internal database settings. | Hide registry fields; focus on role ownership maps. |
| **Opportunities** | Owner | Technical scoring variables. | Focus on "Quick Wins Shipped". |
| **Workflows** | Coordinator | Manual webhook playbacks visible. | Clean up mock triggers; keep only pilot-ready desk forms. |
| **Transactions** | TC / Owner | "Deals" terminology; missing forecast cards. | Standardize to "Transactions"; add risk-adjusted metric cards. |
| **People & Roles** | Ops Lead | DB indices showing. | Clean up table layout. |
| **Integrations** | Ops Lead | Dev Credentials input. | Hide dev keys; simplify setup to basic connection status. |
| **Audit** | Ops Lead | Scrambled raw log strings. | Render user-friendly action logs. |
| **Settings** | Admin | Onboarding wizard mentions developer settings. | Focus solely on onboarding/QA checkoff lists. |
| **Weekly Brief** | Owner | Technical stats showing. | Dynamic aggregate totals; export to Markdown. |
| **Approval Center** | Ops Lead / Owner | "Payload draft" shows raw code parameters. | Render editable outreach templates. |
