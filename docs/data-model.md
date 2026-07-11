# Database Schema & Data Model: .Shapework

This document details the multi-tenant PostgreSQL structure of `.Shapework`, highlighting the Row Level Security (RLS) layout and relation trees.

## Multi-Tenancy Design
Every operational table includes the following audit and isolation fields:
* `id` (UUID, primary key)
* `organization_id` (UUID, foreign key to `organizations`)
* `created_at` (timestamp with time zone, default `now()`)
* `updated_at` (timestamp with time zone, default `now()`)
* `created_by` (UUID, foreign key to `profiles`, nullable)
* `source_system` (text, e.g., `'rechat'`, `'mock'`, `'gmail'`)
* `external_id` (text, corresponding ID in source system, nullable)

## Essential Tables

### 1. Tenants & Memberships
* `organizations`: The top-level brokerage context.
* `organization_settings`: Configuration flags, custom action rules, labor hour assumptions.
* `profiles`: User records with auth metadata.
* `organization_memberships`: Ties a `profile` to an `organization` with specific `roles` (`owner`, `admin`, `operations_manager`, `coordinator`, `agent`, `read_only`).

### 2. Sourced & Snyced Entities
* `contacts`: Buyers, sellers, escrow officers, title representatives, lenders.
* `agents`: Sourced real estate professionals within the brokerage.
* `properties`: Physical address and characteristic data.
* `listings`: Properties currently active, pending, or sold.
* `transactions`: Core escrow file representing buyer or seller representation. Includes current stage, expected closing, health score, and risk status.
* `transaction_participants`: Map of contacts assigned to individual transaction roles.
* `transaction_milestones`: Dates and status for contingencies (financing, appraisal, inspection, etc.).

### 3. Workflow Engine
* `workflow_templates`: Blueprint templates (e.g., `'New Listing Launch'`, `'Contract-to-Close'`).
* `workflow_template_steps`: Trigger, assigned role, offset logic, integration action.
* `workflow_runs`: Current instance of a workflow associated with a transaction.
* `workflow_step_runs`: Status of individual checklist stages within an active run.

### 4. Communication & Actions
* `tasks`: Sourced or internally generated todo items.
* `task_dependencies`: Blocking relationships.
* `documents`: Files attached to transactions with signature and status flags.
* `communications`: Logs of emails, text messages, or calendar events.
* `risk_signals`: Identified risk explanations (e.g., missed deadlines or uncooperative contacts).
* `ai_conversations` / `ai_messages`: User chats with the AI Operations Employee.
* `ai_action_proposals`: Suggested administrative tasks (e.g., draft email) awaiting human approval.
* `approval_requests`: Action state records (`suggested`, `awaiting_approval`, `approved`, `executing`, `completed`, `failed`, `dismissed`).
* `action_executions` / `audit_events`: Full history logs of what was completed.
* `roi_metrics`: Tracked savings computed using configured labor variables.
