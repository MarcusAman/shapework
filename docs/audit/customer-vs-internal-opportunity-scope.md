# Customer Console vs. Internal Opportunity Scope

This document details the scoping of the Nest opportunity list, verifying that customer-facing pilot views remain clean and focused on brokerage operations, with future/unapproved features parked internally.

---

## 1. Active Customer Pilot Scope

The customer-facing `/app` routes render ONLY the active operational capabilities:
- **Today Dashboard / Overview**: High-level alert centers mapping to active issues.
- **Work Queue**: Unified task inbox for operations staff and coordinators.
- **Transactions Ledger**: Commission forecasting, pipeline dates, and lead sources.
- **Compliance Guard**: Document checklists, T-days countdown risks, and approval drafts.
- **Marketing Request Desk**: Photography scheduling, print/flyer orders, and launch checklist.
- **People & Ownership**: Roles assignments and responsibility backup mappings.
- **Office & Signage**: Supply counts, sign inventories, and vendor lookups.
- **Approvals Center**: HITL authorization center for sensitive agent messages.
- **Owner Brief**: Weekly rollup summaries for executive leadership.

---

## 2. Parked Internal Backlog (Back-Office Only)

The following 9 future modules are parked and **not** exposed in `/app` navigation rails, rails headers, or dashboards:
1. **Agent Happiness Monitor**: Filtered out to avoid early pilot noise.
2. **Friends of Nest Engine**: Excluded from active customer databases.
3. **Event Planning Playbook**: Excluded from active workflows.
4. **Cost Leakage Alerts**: Removed from Today dashboard rollup panels.
5. **Lead Routing Mini-System**: Parked in settings backlog.
6. **Agent Birthday / Life Event CRM**: Removed from active contact directories.
7. **Full Agent Support Desk chatbot**: Search bar query processing is restricted to command lookup logs, with the full conversational support chatbot parked.
8. **Full accounting / Gospel replacement**: Limited to QuickBooks status badges under Integrations.
9. **Full autonomous Transaction Pre-Check AI**: All drafts gate behind Approvals.
