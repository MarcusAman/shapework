-- Migration: 20260815000000_staff_sop_contribution_and_governance.sql
-- Enhanced schema for Staff SOP Contribution, Account Activation, Review, Approval, and Publication

-- 1. ENHANCED SOP AUTHORING REQUESTS
DROP TABLE IF EXISTS sop_authoring_requests CASCADE;
CREATE TABLE IF NOT EXISTS sop_authoring_requests (
    id VARCHAR(100) PRIMARY KEY,
    workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    employee_id VARCHAR(100),
    employee_name VARCHAR(255) NOT NULL,
    employee_role VARCHAR(255) NOT NULL,
    employee_email VARCHAR(255) NOT NULL,
    assignment_type VARCHAR(50) NOT NULL DEFAULT 'known_process', -- 'known_process' | 'role_discovery'
    process_name VARCHAR(255) NOT NULL,
    process_context TEXT,
    department VARCHAR(100) DEFAULT 'Operations',
    location VARCHAR(100) DEFAULT 'All Offices',
    applicable_roles TEXT[] DEFAULT '{}',
    starting_method VARCHAR(50) DEFAULT 'nora_guided', -- 'blank' | 'template' | 'duplicate' | 'nora_guided'
    discovery_source_ids TEXT[] DEFAULT '{}',
    starter_draft_id VARCHAR(100),
    requested_by_user_id VARCHAR(100) NOT NULL,
    requested_by_name VARCHAR(255) NOT NULL,
    process_owner_name VARCHAR(255),
    reviewer_user_id VARCHAR(100),
    reviewer_name VARCHAR(255),
    bic_reviewer_user_id VARCHAR(100),
    bic_reviewer_name VARCHAR(255),
    final_approver_user_id VARCHAR(100) DEFAULT 'usr_ryan',
    final_approver_name VARCHAR(255) DEFAULT 'Ryan Crecelius',
    due_date DATE,
    requested_review_date DATE,
    risk_level VARCHAR(50) DEFAULT 'standard', -- 'low' | 'standard' | 'compliance_sensitive'
    requires_bic_review BOOLEAN DEFAULT FALSE,
    instructions TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'sent', -- 'draft' | 'sent' | 'opened' | 'in_progress' | 'submitted' | 'changes_requested' | 'bic_approved' | 'approved' | 'published' | 'expired' | 'revoked'
    token_hash VARCHAR(100) UNIQUE NOT NULL,
    token_expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    resulting_sop_draft_ids TEXT[] DEFAULT '{}',
    prior_starter_draft_id VARCHAR(100),
    review_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sop_authoring_requests_ws_status ON sop_authoring_requests(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_sop_authoring_requests_token_hash ON sop_authoring_requests(token_hash);
CREATE INDEX IF NOT EXISTS idx_sop_authoring_requests_email ON sop_authoring_requests(workspace_id, employee_email);

-- 2. IMMUTABLE SOP VERSION SNAPSHOTS
CREATE TABLE IF NOT EXISTS sop_version_snapshots (
    id VARCHAR(100) PRIMARY KEY,
    sop_id VARCHAR(100) NOT NULL REFERENCES sop_drafts(id) ON DELETE CASCADE,
    workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    version_number VARCHAR(50) NOT NULL,
    snapshot_type VARCHAR(50) NOT NULL, -- 'submitted' | 'bic_approved' | 'published' | 'superseded'
    document_snapshot JSONB NOT NULL,
    created_by_user_id VARCHAR(100),
    created_by_name VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sop_version_snapshots_sop ON sop_version_snapshots(sop_id, version_number);

-- 3. SECTION-LEVEL REVIEW COMMENTS
CREATE TABLE IF NOT EXISTS sop_review_comments (
    id VARCHAR(100) PRIMARY KEY,
    sop_id VARCHAR(100) NOT NULL REFERENCES sop_drafts(id) ON DELETE CASCADE,
    workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    authoring_request_id VARCHAR(100) REFERENCES sop_authoring_requests(id) ON DELETE CASCADE,
    section_key VARCHAR(100) NOT NULL, -- 'title' | 'purpose' | 'steps' | 'decisions' | 'compliance' | 'general'
    step_number INTEGER,
    comment TEXT NOT NULL,
    is_blocking BOOLEAN NOT NULL DEFAULT TRUE,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    author_user_id VARCHAR(100) NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sop_review_comments_sop ON sop_review_comments(sop_id, resolved);

-- 4. FORMAL APPROVAL AUDIT LEDGER
CREATE TABLE IF NOT EXISTS sop_formal_approvals (
    id VARCHAR(100) PRIMARY KEY,
    sop_id VARCHAR(100) NOT NULL REFERENCES sop_drafts(id) ON DELETE CASCADE,
    workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    approval_type VARCHAR(50) NOT NULL, -- 'operational_review' | 'bic_compliance' | 'owner_publication'
    approver_user_id VARCHAR(100) NOT NULL,
    approver_name VARCHAR(255) NOT NULL,
    approver_role VARCHAR(100) NOT NULL,
    version_approved VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sop_formal_approvals_sop ON sop_formal_approvals(sop_id);
