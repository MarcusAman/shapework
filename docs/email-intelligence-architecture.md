# Email Intelligence Architecture

This document describes the step-by-step pipeline through which shapework. extracts business events from email communications.

## Ingestion & Classification Pipeline

```
Email Received 
   ↓
Sender Identified & Domain Verified
   ↓
Record Matched (Operating Memory lookup)
   ↓
Intent Classified (NLP matching rules)
   ↓
Stage / Milestone Inferred
   ↓
Risk & Compliance Evaluated
   ↓
Action Proposed (Action Proposal queue)
   ↓
Automation Safeguard Checked
   ↓
[Requires Approval?] ── Yes ──> Staging Draft Queue (Human-in-the-Loop)
   ↓ No
Database Record Updated
   ↓
Audit Event Recorded (Rollback enabled)
```

## Detailed Processing Stages

### 1. Inbound Ingress
Authorized email boxes (e.g. `operations@nest-demo.local`) listen via IMAP or MS Graph Webhook triggers. Raw email headers and text bodies are streamed to the pipeline.

### 2. Sender Domain Verification
Matches the sender address against active transaction contacts (Roster Agents, Co-op Agents, Lenders, Escrow Officers). The pipeline validates DKIM/SPF parameters to prevent email spoofing of sensitive financial messages.

### 3. Operating Memory Record Matching
Cross-references addresses, client names, and text contexts against the active folder database:
* *Example query:* "We are ready on Baker St disclosures."
* *Memory resolution:* Resolves to `221 B Baker Street` because agent Brooke Shields is the listing agent and disclosures were flagged as missing.

### 4. Intent Classification
Classifies the email intent using a rule-based and vector NLP matching router:
* **stage_update**: e.g., "Underwriter says clear to close."
* **risk_alert**: e.g., "Inspection reports indicate active foundation cracks."
* **document_upload**: e.g., "Signed buyer agreements attached."

### 5. Risk & Compliance Evaluation
Determines potential legal and compliance exposure. If a milestone updates (e.g., offer submitted) but a required form is missing (e.g., buyer agency agreement), a **Compliance Alert** is logged.

### 6. Action Proposal & Safeguard Checking
Generates the corresponding `AIActionProposal` task and checks it against the **Automation Policy**:
* If `confidence >= threshold` and the risk level is `low`, the pipeline queues it for auto-execution.
* If the proposal violates safeguards or has low confidence, it is marked as `suggested` and sent to the **Operations Inbox** for review.

### 7. Execution & Audit Ledger Entry
Updates target records (Dotloop, SkySlope) and writes an immutable record to the ledger, tracking the email source, confidence score, matching rules applied, and the before/after state to enable rollback.
