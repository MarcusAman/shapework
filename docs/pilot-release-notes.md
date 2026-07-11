# Pilot Release Notes

Welcome to the initial pilot release of **shapework.**, the operating layer for brokerage operations.

---

## 1. What Is Included in This Release
* **Role-Based Command Center**: Custom dashboards for Owner/COO, Operations Lead, TC, and Marketing Coordinator roles.
* **Work Queue Inbox**: Interactive inbox supporting 10 filter categories, slide-out detail drawers, coordinator comments, and bulk updates.
* **Marketing Request Desk**: Standardized forms for 9 marketing assets (Flyers, Postcards, Social Media) with automated intake guard validation.
* **Pipeline Forecasting**: Tabular ledger tracker showing active closing timelines, missing fields, and risk-adjusted commission forecasts.
* **Human-in-the-Loop Approval Center**: Outbox quarantine gate protecting agents and clients from automated notification spam.
* **Data Import Center**: Built-in validators for CSV spreadsheet uploads across 6 roster and checklist templates.

## 2. Supported Integrations
* **Rechat**: Active matching connectors for client profile syncs.
* **Dotloop / API Nation**: Escrow closing stages and transaction compliance file monitors.
* **Gmail / Microsoft Outlook**: Gated drafts for outbound coordination tasks.

## 3. Manual-First Launch Path
* To ensure immediate readiness, this release supports a **manual-first** operational flow:
  1. Operations Leads download the CSV data templates from the Data Import tab.
  2. Paste and validate roster, transaction, and compliance checklists.
  3. The system generates missing data alerts in the Work Queue automatically.

## 4. What Is Not Included Yet & Known Limitations
* **Direct Database Sync**: Real-time writeback synchronization with Dotloop databases is currently gated; coordinators must approve and trigger syncing manually.
* **Mobile App Stores**: Native iOS and Android apps are not included in this phase. The application is accessed via mobile and tablet web browsers.

## 5. First-Week Recommendations
* Day 1: Download the CSV templates, complete the First Brokerage Pilot Checklist under settings, and import your active transaction roster.
* Day 2-5: Let your Transaction Coordinator triage missing closing dates and use the Approval Center to dispatch reminders. Keep the Owner Brief open during morning alignment calls.
