# Shapework Audit: Brokerage AI Coworker Workboard

Evolving the Shapework brokerage application from a standard transactional dashboard/ticketing queue into a Sai-inspired AI coworker experience.

## Context & Vision
Traditional real-estate dashboards present static status boards, forcing broker-owners or transaction coordinators to review lists of items and perform manual triage. Shapework’s AI coworker model turns this passive dynamic upside down:
- The operator inputs plain-English goals.
- The coworker maps integration routes, structures a step-by-step plan, evaluates risks, and executes tasks.
- Highly sensitive steps (outbound communications, invoice scheduling, CRM mutations) are gated behind explicit operator approval gates.

This differs from generic "GUI computer-use agents" because it executes via a direct integration hierarchy (API first, webhook second, email/SMS third, secure action links fourth, voice call fifth, and GUI computer use only as a low-confidence fallback).

## Architectural Changes

### 1. Routes & Consolidated Navigation
The customer routing has been consolidated to five streamlined operational tabs:
- **Workboard** (`/app/workboard`) - The central hub containing the task composer, plan visualization timelines, and active/completed work streams.
- **Work Queue** (`/app/work`) - Deep ledger queue for operational items.
- **Approvals** (`/app/approvals`) - Human-in-the-loop review center for gated coworker actions.
- **Owner Brief** (`/app/owner-brief`) - Premium weekly executive brief.
- **Settings** (`/app/settings`) - Profile and workspace settings.

### 2. Data Models
- **`shapework_jobs`**: Logs the request composer text, triaged job type, confidence rating, overall state, and active steps.
- **`shapework_job_steps`**: Individual workflow timeline checkpoints with security gates, risk ratings, approved details, and output logs.
- **`shapework_outputs`**: Assets created or completed (emails, review links, checklists, and document requests).

### 3. Nest Realty Workflows
Pre-seeded data represents key operational opportunity loops in the Nest Realty demo workspace:
- **Google Review Engine**: Dispatches review links to clients after closings.
- **Compliance Chase Engine**: Audits Dotloop disclosures and alerts coordinators of missing documents.
- **Ryan Shield / SOP Routing**: Deflects low-priority facilities and maintenance queries away from executive mailboxes.
- **Escrow / Escalation Mapping**: Constructs routing chains and alerts relevant closing partners.

## Remaining Risks & Mitigations
- **Context Drift**: If the user inputs highly abstract or unrelated plain-English tasks, the triage mapping defaults to custom workflows with structured verification.
- **Integration Reliability**: Webhooks and external APIs may return exceptions. Blocked steps capture these errors and present clean retry gates.

## Next Sprint Recommendations
- **Dynamic SOP Engine**: Allow operators to save custom rules and workflows straight from the workboard as reusable blueprints.
