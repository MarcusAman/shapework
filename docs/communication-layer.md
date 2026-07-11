# shapework. Communication Layer Specification

## Overview
The **Communication Layer** is designed to transform raw conversations into structured operational states. Rather than functioning as a passive archive, shapework. maps every email, text, or phone note to active milestones, task completions, and compliance reviews.

---

## Technical Flow
1. **Inbound Ingestion**: Email inbox streams, text messages, webhooks, and secure mobile link submissions are captured.
2. **Entity Recognition**: The system maps participants to roles (Agent, Client, Lender, Title Officer, Escrow Agent, photograher).
3. **Intent Classification**: Classifies message intent (e.g., "Earnest Money Deposited", "Inspection scheduled").
4. **Task Extraction**: Proposes updates to standard brokerage milestones.
5. **Human Approval**: The operations coordinator or managing broker reviews the proposed change before any state change is written to database logs or external source systems.

---

## Key Features
* **Normalized Metadata**: Identifies source system tags (e.g., Follow Up Boss, Rechat, Dotloop) but displays information in a unified, system-agnostic visual timeline.
* **Smart Composer**: A beautiful, premium writing environment loaded with contextual suggestions. It drafts transactional emails, follow-ups, and SMS alerts tailored to the exact deal state.
* **Proactive Reminders & Escalations**: Tracks pending vendor requests (e.g., waiting on lender approval). If no response is received by the specified deadline, shapework. drafts an escalation message or flags the transaction as *Needs Attention*.
