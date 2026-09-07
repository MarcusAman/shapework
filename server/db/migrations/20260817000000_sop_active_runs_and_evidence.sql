-- Migration: Active SOP Checklist Execution Runs & Step-Level Evidence
-- Date: 2026-08-17
-- Description: Creates normalized tables for tracking running SOP checklist instances across properties, step completions, SLA turnaround timers, and uploaded verification evidence.

CREATE TABLE IF NOT EXISTS sop_runs (
    id VARCHAR(64) PRIMARY KEY,
    workspace_id VARCHAR(64) NOT NULL,
    tenant_id VARCHAR(64) NOT NULL DEFAULT 'tenant_nest_uat',
    sop_id VARCHAR(64) NOT NULL,
    sop_version INTEGER NOT NULL DEFAULT 1,
    title VARCHAR(255) NOT NULL,
    property_address VARCHAR(255) NOT NULL,
    transaction_id VARCHAR(64),
    assignee_id VARCHAR(64),
    assignee_name VARCHAR(255) NOT NULL,
    assignee_role VARCHAR(64) DEFAULT 'Transaction Coordinator',
    status VARCHAR(32) NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'at_risk', 'awaiting_evidence', 'completed', 'blocked'
    priority VARCHAR(32) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    progress_percent INTEGER NOT NULL DEFAULT 0,
    current_step_number INTEGER NOT NULL DEFAULT 1,
    total_steps INTEGER NOT NULL DEFAULT 1,
    target_completion_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sop_runs_ws ON sop_runs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_sop_runs_status ON sop_runs(status);
CREATE INDEX IF NOT EXISTS idx_sop_runs_sop ON sop_runs(sop_id);
CREATE INDEX IF NOT EXISTS idx_sop_runs_property ON sop_runs(property_address);

CREATE TABLE IF NOT EXISTS sop_run_steps (
    id VARCHAR(64) PRIMARY KEY,
    run_id VARCHAR(64) NOT NULL REFERENCES sop_runs(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    action TEXT NOT NULL,
    role VARCHAR(64) NOT NULL,
    system_used VARCHAR(128),
    sla_hours INTEGER DEFAULT 24,
    status VARCHAR(32) NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'blocked'
    completed_by_id VARCHAR(64),
    completed_by_name VARCHAR(255),
    completed_at TIMESTAMPTZ,
    evidence_type VARCHAR(64), -- 'url_link', 'mls_number', 'photo_upload', 'text_note', 'confirmation'
    evidence_value TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sop_run_steps_run ON sop_run_steps(run_id);
CREATE INDEX IF NOT EXISTS idx_sop_run_steps_status ON sop_run_steps(status);

CREATE TABLE IF NOT EXISTS sop_run_evidence (
    id VARCHAR(64) PRIMARY KEY,
    run_step_id VARCHAR(64) NOT NULL REFERENCES sop_run_steps(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    uploaded_by VARCHAR(255),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sop_run_evidence_step ON sop_run_evidence(run_step_id);
