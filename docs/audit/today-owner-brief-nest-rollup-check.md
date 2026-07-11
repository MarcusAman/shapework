# Today and Owner Brief Nest Rollup Check

This document audits the dynamic summary dashboards on `/app` (Today) and `/app/owner-brief`, ensuring they cleanly rollup genuine database states without paragraph copy or hardcoded mockup data.

---

## 1. Today Page Summary Audit

- **Dynamic Metrics Evaluated**:
  - **Revenue / Commission at Risk**: Aggregated sum of closed/pending transactions marked as `at_risk` or `blocked` (e.g. Evergreen Terrace $15,400 + Evergreen foundation crack $11,200).
  - **Files Needing Attention**: Incomplete listing and compliance task checklist counters.
  - **Pending Owner Decisions**: Total count of approval-gated items currently pending in the `actionProposals` table.
  - **Owner Interruptions Avoided**: Rollup count of issues resolved or assigned directly to staff (such as low signage orders and routine facilities issues).
  - **Marketing Bottlenecks**: Active listing photography delays and incomplete marketing intake tickets.
  - **Role Gaps**: Vacant key roles (such as unassigned Marketing Coordinator).
  - **Office / Signage Issues**: Damaged yard signs and low inventory alerts.

- **Presentation Style Verification**:
  - Clean card container styling utilizing design tokens.
  - No plain/black/white internal markdown formatting blocks.
  - Summaries are brief, actionable, and visual.

---

## 2. Owner Weekly Brief Audit

- **Dynamic Sections Checked**:
  - **Owner-Worthy Decisions**: Proposals requiring executive owner signatures before action is taken.
  - **Routine Issues Shielded**: Low-level signage tasks and facilities updates filtered out from owner notification rails.
  - **Compliance Risks**: Countdown buckets (T-3 / T-7 / T-14 / T-30) highlighting looming deal risk.
  - **Commission Readiness Risks**: Verification status of closing transactions.
  - **Marketing Requests Stuck**: Intake tickets awaiting agent uploads.
  - **Office/Signage Issues**: Stock levels and facilities work logs.
  - **Role Gaps**: Unassigned staff roles.
  - **Wins This Week**: Count of successfully closed deals and resolved issues.

---

## 3. Data Integrity & Traceability
All statistics are verified to fetch from live in-memory/Postgres records. No mock placeholder indicators or plain string mock-ups are used on the `/app` customer console routes.
