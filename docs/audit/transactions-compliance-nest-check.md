# Transactions & Compliance Nest Check

This document audits the transaction closing pipelines and compliance guard features, verifying that closing files, countdown risk buckets, and commission payout metrics are fully operational.

---

## 1. Transactions Pipeline Verification

- **Expected Commission**: Sourced directly from transaction revenues in the database, verifying commission projection totals.
- **Referral / Source**: Sourced from the transaction source field, tracking whether it is "Rechat", "FUB", or "Agent".
- **Commission Readiness**: Labeled based on compliance checklists completion and missing docs count.
- **Surprise Closing Risk**: High-risk statuses triggered on missing closing dates or blocked foundation inspection reports.
- **Next Action**: Sourced from next action steps to guide coordinator daily tasks.
- **Compliance Status**: Tracks whether files are approved, pending, or rejected.
- **Missing Docs Flag**: Triggers compliance chase workflow items in the database.

---

## 2. Compliance Guard Verification

- **Closing Countdown Buckets**: Deals are segmented by remaining days to close (T-3 / T-7 / T-14 / T-30) to prioritize chaser intensity.
- **Missing Required Documents**: Sourced from outstanding transaction milestones tasks.
- **Reminder Drafts State**: Reminders generated for agents are stored as approval proposals and cannot bypass human authorization.
- **Assigned Compliance Owner**: Sourced from role mappings (Compliance Partner Laura Croft).
- **Audit Integration**: Resolving a document issue or uploading a missing file updates transaction status and records audit events.
