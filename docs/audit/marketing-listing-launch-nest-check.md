# Marketing and Listing Launch Nest Check

This document verifies the marketing requests portal, listing launch checklists, and post-closing Google review triggers, confirming compliance with human-in-the-loop (HITL) approval gates.

---

## 1. Marketing Requests Intake

- **Incomplete Requests**: Submit forms automatically detect missing photography links or short descriptions, creating `missing_information` Work Queue items with `waiting_on_agent` statuses.
- **Outreach Approvals**: Gating outreach texts avoids direct/unapproved messaging, sending drafts through `/api/action/propose`.
- **Intake Flow Options**: Supports print flyers, listing brochures, social posts, open house assets, listing launch assets, bio updates, and review requests.

---

## 2. Listing Launch Checklists

- **Integration**: Listing launch checklists are integrated into the marketing desk and Work Queue, rather than as a separate dashboard page.
- **Checklist Steps**: Tasks like photographer scheduling, yard sign post installation, and flyer drafting create actionable coordinator tasks.

---

## 3. Google Review Request Engine

- **Trigger Event**: Post-closing event triggers a neutral Google review request email draft.
- **Neutral Formatting**: Neutral text avoids gating based on private satisfaction scores.
- **Approval Gate**: Review requests require coordinator approval, routing to the Approvals center.
- **Auditing**: Audit events are recorded on draft proposal and execution.
