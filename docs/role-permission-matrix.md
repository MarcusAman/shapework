# Role-Based Permission Matrix

This document defines access controls and permitted actions across the primary operator roles configured in **shapework.**.

---

## Permission Matrix Table

| Role | Allowed Screens | Allowed Actions | Blocked Actions |
| :--- | :--- | :--- | :--- |
| **Owner (Executive)** | Command Center, Work Queue, Approvals, Closing Tracker, Operating Record, Audit, Settings | Authorize outbox dispatches, mark owner tasks resolved, reset sandbox data, read auditing trails | Directly override coordinator checklist steps without logging |
| **Operations Lead** | Command Center, Work Queue, Approvals, Closing Tracker, Readiness, People, Integrations, Audit, Settings | Configure routing maps, assign task owners, check out yard signs, import CSV templates, verify pilot checklist | Approve critical legal outbox dispatches (requires Owner checkoff) |
| **Transaction Coordinator (TC)** | Command Center (TC view), Work Queue, Closing Tracker, Compliance Guards | Log new transactions, update escrow stages, draft agent compliance notifications | Modify global integrations credentials, adjust marketing flyer templates |
| **Marketing Coordinator** | Command Center (Marketing view), Work Queue, Marketing Desk | Intake design submissions, request details clarification, complete flyer layouts | Edit transaction escrows, modify office inventory thresholds |
| **Agent (Portal)** | Secure public forms (Request intake, checklist upload) | Submit request details, upload requested documents | Access command consoles, view pipeline metrics, view team rosters |
