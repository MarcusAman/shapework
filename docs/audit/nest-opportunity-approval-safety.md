# Nest Opportunity Approval Safety

This document audits the human-in-the-loop (HITL) approval safety mechanisms in the brokerage operating console, ensuring that all sensitive outbound actions are gated and cannot bypass authorization.

---

## 1. Approval Safety Matrix

| Action | Gating Mechanism | Target Table | Auto-Send Bypassed? | Audited Fields |
| :--- | :--- | :--- | :--- | :--- |
| **Agent Reminder** | Draft email chasers are held in `actionProposals` until manager approval is clicked | `actionProposals` | No | Actor, timestamp, draft content |
| **Secure Upload Link** | Document request link draft held in queue | `actionProposals` | No | Target recipient, transaction ID |
| **Secure Clarification** | Agent info-chasing outreach draft held in queue | `actionProposals` | No | Target agent, draft text |
| **Google Review Request** | Post-closing neutral review requests draft submitted to propose endpoint | `actionProposals` | No | Client name, property address, email text |
| **Rechat Writeback** | CRM folder and task writing triggered ONLY after explicit human approval | `actionProposals` | No | Rechat Deal ID, task metadata |
| **Dotloop Webhook Sync** | API Nation updates are validated and low-confidence matches hold for approval | `actionProposals` | No | Match rating, before/after records |

---

## 2. Safety Verification Audits

1. **No Outbound Bypasses**: Outbound email, SMS, or third-party writebacks do not execute automatically. They require explicit POST calls to `/api/action/approve`.
2. **Payload Mutability**: Approval item edits (e.g. updating the outreach message or target assignee) update the database payload so that the edited message is what gets transmitted when approved.
3. **Rejection Safeguards**: Rejected proposals trigger state changes to `rejected` or `dismissed` and never invoke background jobs or external network webhooks.
4. **Audit Logging**: Every approval action log entries in `/api/audit` containing the actor profile name, role, timestamp, and target property impact details.
