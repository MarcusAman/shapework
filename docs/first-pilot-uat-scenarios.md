# First Pilot UAT Scenarios Manual

This document details the step-by-step User Acceptance Testing (UAT) scenarios to verify that the **shapework.** platform operates reliably for real-world brokerage teams.

---

## Scenario 1: Manual-first workspace setup

### Objective
Verify that a new workspace is correctly established, roles are assigned, permissions gate tabs, and audit records capture the configurations.

### Steps
1. Navigate to **Settings** -> **Customer Launch Room**.
2. Run through the launch checklist (Workspace metadata input, routing configurations).
3. Navigate to **People** and assign team members:
   * **Sarah Jenkins** -> Owner / COO
   * **Alex Carter** -> Operations Lead
   * **Emma Watson** -> Transaction Coordinator
   * **Robert Vance** -> Marketing Coordinator
4. Switch profiles in the top bar to verify dashboard adaptations:
   * Owner dashboard shows high-level decisions.
   * TC dashboard prioritizes intake gaps and transaction tables.
   * Marketing dashboard prioritizes production request cards.

### Expected Outcomes
* Profile assignments persist.
* System menus adapt dynamically.
* Audit trail registers profile modifications.

---

## Scenario 2: Import active transactions

### Objective
Verify that uploading transaction spreadsheets works, highlights data deficiencies, avoids duplicate tasks, and logs imports.

### Steps
1. Navigate to **Settings** -> **Data Import**.
2. Select **Active Transactions Template** and copy the CSV text.
3. Paste the text in the intake box and click **Validate Schema & Parse Rows**.
4. Confirm columns match and preview values.
5. Click **Import Rows**.
6. Navigate to **Closing Tracker** to confirm imported files appear.
7. Confirm that rows missing target closing dates or expected commissions generate task tickets in the **Work Queue**.
8. Import the exact same CSV again; confirm that no duplicate Work Queue items are created.

### Expected Outcomes
* Transactions are successfully created.
* Gaps are identified.
* Task duplicates are blocked.
* Audit ledger logs the import event.

---

## Scenario 3: Marketing request intake

### Objective
Verify that a marketing flyer request triggers intake guards, requires authorization before contacting agents, and records on the dashboard.

### Steps
1. Navigate to **Marketing Desk**.
2. Submit a flyer request but omit agent contact info or list size details.
3. Verify that the intake guard halts submission or tags it "Clarification Needed".
4. Navigate to **Work Queue** and locate the newly generated marketing clarification task.
5. Select the card to open the **Detail Drawer**.
6. Type a draft correction message in the input and click **Send to Approvals**.
7. Navigate to the **Approval Center**; verify the draft is locked under approvals.
8. Click **Approve & Dispatch** on the card.
9. Verify the item status transitions to "Waiting on Agent".
10. Once agent info is uploaded, mark the task resolved.

### Expected Outcomes
* Task created.
* Outbox message gated under Approval Center.
* Audit trail captures draft updates.
* Weekly Owner Brief tracks deflected work.

---

## Scenario 4: Closing compliance risk

### Objective
Verify compliance check alerts for missing documents are triggered, gated, and tracked.

### Steps
1. Navigate to **Closing Tracker** -> **Log Transaction**.
2. Add a transaction closing in 6 days (e.g. June 2026).
3. Omit the required compliance documents.
4. Verify the **Closing Compliance Guard** tags it high-risk due to "Missing Docs".
5. Confirm a compliance risk task appears in the **Work Queue**.
6. In the task drawer, draft an upload request to the agent and send it to **Approvals**.
7. In the **Approval Center**, modify the message body to add specific files, then click **Approve**.
8. Verify the compliance task gets logged as sent.

### Expected Outcomes
* Alert flagged.
* Duplicate alerts blocked.
* Owner brief tracks the legal risk.

---

## Scenario 5: Office/sign issue

### Objective
Verify supply and sign inventory levels trigger alerts, assign responsibilities, and protect owners from noise.

### Steps
1. Navigate to **Office Readiness** -> Checkout 9 of 10 Yard Signs.
2. Confirm the low-stock threshold triggers an alert.
3. Confirm a task is automatically placed in the Work Queue assigned to the **Operations Lead**.
4. Verify the **Owner Console** remains clean of this task (no interruption).
5. Resolve the inventory shortage by clicking mark resolved in the Work Queue.
6. Verify the **Owner Brief** lists the event as "1 Deflected Interruption".

### Expected Outcomes
* Alert created.
* Assigned to Operations Lead.
* Owner shielded from noise.

---

## Scenario 6: Weekly Owner Brief

### Objective
Verify that the executive brief compiles real, non-PII workspace stats and exports clean Markdown.

### Steps
1. Navigate to **Weekly Owner Brief**.
2. Confirm that stats (deflected tasks, risk files) reflect current database records.
3. Click **Copy Summary Brief**.
4. Click **Download Brief**.
5. Paste clipboard text into a document; check that no client phone numbers or email addresses are exposed.

### Expected Outcomes
* Calculations match database state.
* No private PII elements.
* Markdown formatting is correct.

---

## Scenario 7: Approval safety

### Objective
Ensure no automated script can dispatch external emails or SMS alerts without human-in-the-loop validation.

### Steps
1. Log in as **Marketing Coordinator**.
2. Try to dispatch a listing update.
3. Confirm that the dispatch button says "Queue for Approval".
4. Log in as **Owner** and locate the action card in the **Approval Center**.
5. Edit the message details.
6. Click **Approve**.
7. Check the **Audit Ledger** for the approval stamp (timestamp, agent, changes).

### Expected Outcomes
* Message blocked from direct dispatch.
* Edits verified.
* Audit records approval actor.
