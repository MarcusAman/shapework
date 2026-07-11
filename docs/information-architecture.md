# .shapework. Information Architecture
*Last Updated: June 2026*

## Unified Navigation Blueprint
`.shapework.` integrates a collapsible, high-contrast Left Sidebar with an intuitive context header on the active work canvas. It groups administrative and team control surfaces separately from daily operational feeds.

```
+-------------------------------------------------------------+
|  shapework. (Profile Switcher)                             |
|                                                             |
|  [CMD] COMMAND CENTER                                       |
|  [IBX] OPERATIONS INBOX (Unread Indicator)                  |
|  [OPR] AI OPERATOR WORKSPACE                                |
|  [TXS] ACTIVE TRANSACTIONS                                  |
|  [LST] LISTING COORDINATION                                 |
|  [WRK] AUTOMATED WORKFLOWS                                  |
|  [TSK] SYSTEM TASKS                                         |
|  [INT] CONNECTED SENSORS / INTEGRATIONS                     |
|                                                             |
|  [?] SUPPORT / SETTINGS / LOG OUT                           |
+-------------------------------------------------------------+
```

---

## Screen Hierarchies & Data Routing

### 1. Command Center (Daily Briefing & Control Desk)
* **Above-the-Fold Prose**: Large, editorial paragraph summary stating precisely what has changed since the operator's last session, indicating active bottlenecks and highest risks.
* **Ranked Priority Actions Queue**: Ordered by urgency and exposure rating. Contains action-oriented recommendations prepared by AI models, waiting for human approval (`Approve & Dispatch`).
* **Bento Analytics Region**: Dynamic metrics showing estimated hours saved, transaction health portfolio distribution, listings status, and live activity streams.

### 2. Operations Inbox (The Three-Pane Stream)
* **Pane 1 (Filters)**: Sourced streams from Google, Outlook, DocuSign, and Rechat APIs, allowing rapid directory switching.
* **Pane 2 (List)**: Senders, subjects, timestamp, and AI-categorized labels (signatures, financing, disclosures) with confidence levels.
* **Pane 3 (Detail & Evidence)**: Sourced email/doc payload view, associated transaction details, and the draft response panel waiting for validation.

### 3. Active Transactions & Drilldown Detail
* **Global Overview Table**: Interactive columns featuring stage trackers, assigned coordinators, expected closing dates, and live health metrics.
* **Drilldown Panel (Tabs)**:
  * *Overview*: Sourced external update logs and participant indexes.
  * *Milestones*: Live earnest money, option period, and contingency dates.
  * *Tasks*: Active internal checklists.
  * *Audit Trail*: Signed cryptographic audit log events.
