# MVP Scope & Demo Roadmap - shapework.

This document synthesizes the features, interactive paths, and operational objectives implemented in the **shapework.** founder-demo application.

---

## 1. Feature Coverage

The current implementation contains 6 fully interactive screens and layout rails:

1. **Command Center**:
   * Renders the dynamic AI **Morning Briefing** text block.
   * Features the **Decision Queue** with real-time approval controls.
   * Embeds the **Operational Risk Registry** table with active filters.
   * Displays capacity checks for Diane Ross, Emma Watson, and Todd Howard.
   * Houses the **AI Workbench** drafting queue.
2. **Operations Inbox**:
   * Displays the three-pane communication-to-action layout.
   * Maps unread, high-urgency signals (emails, calendar proposals, webhooks, DocuSign signatures).
   * Visualizes the AI ingestion pipeline (Ingest -> Match -> Intent -> Action Proposal -> Approvals).
3. **AI Operator**:
   * Interactive conversational workspace allowing query submissions.
   * Returns rich, structured operational card objects rather than plain chatbot text.
4. **Transaction Registry**:
   * Deep exception-first transaction grid.
   * Detail panel with specific tab indices (overview risk diagnostics, milestones timeline, doc audits, and activity histories).
5. **Listing Launch**:
   * Launch checklist progress meters and target launch countdown schedules.
6. **Integrations Hub**:
   * Synchronization status controls (connected toggles, synced record logs, and connection health testers).

---

## 2. Interactive Demo Flow Instructions

For early brokerage demos, follow this chronological script:

1. **Persona Swapping**: Click the profile dropdown in the top-bar. Switch between Sarah Jenkins (COO) and Marcus Aman (Owner) to show how view contexts swap.
2. **Workload Balancing**:
   * In the **Command Center**, scroll down to "Team Coordination Capacity".
   * Note that Diane Ross is at 95% capacity and has 5 overdue tasks.
   * Click **Execute Reassignment** on the suggested reassignment card.
   * Observe the capacity statistics update in real-time (Diane drops to 80%, Emma Watson rises to 55%), and the transaction coordinator assignment for **102 Pine Street** transfers immediately. A security event log is auto-generated in the audit trail.
3. **AI Authorization**:
   * Navigate to the **AI Workbench** or the **Operations Inbox**.
   * Select a draft follow-up email (e.g. Alice Walker Underwriter request).
   * Inspect the extracted intent and the draft content.
   * Click **Approve**. The draft will immediately move to the "Completed Automations" list and sync back to the master database.
4. **Exception Filters**:
   * Open the **Transactions** or **Listings** views.
   * Toggle the top tabs (e.g. *At Risk*, *Missing Docs*, *Wait Lender*) to see rows filter dynamically. Click any row to view deep timeline diagnostics.
