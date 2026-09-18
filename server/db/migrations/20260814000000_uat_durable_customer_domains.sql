-- Migration: 20260814000000_uat_durable_customer_domains.sql
-- Durable PostgreSQL schemas for Org Chart, SOPs, Owner Digest, Directory, and Audit Logs

-- 1. ORG CHARTS
CREATE TABLE IF NOT EXISTS org_charts (
    workspace_id VARCHAR(100) PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
    model JSONB NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(255) NOT NULL DEFAULT 'system'
);

-- 2. ORG CHART POSITIONS (Normalized for indexed hierarchy queries)
CREATE TABLE IF NOT EXISTS org_chart_positions (
    id VARCHAR(100) PRIMARY KEY,
    workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(100),
    reports_to_id VARCHAR(100) REFERENCES org_chart_positions(id) ON DELETE SET NULL,
    roles JSONB DEFAULT '[]'::jsonb,
    responsibilities JSONB DEFAULT '[]'::jsonb,
    sla VARCHAR(255),
    escalation_rule VARCHAR(255),
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_chart_positions_workspace ON org_chart_positions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_org_chart_positions_reports_to ON org_chart_positions(workspace_id, reports_to_id);

-- 3. ORG CHART AUDIT EVENTS
CREATE TABLE IF NOT EXISTS org_chart_audits (
    id VARCHAR(100) PRIMARY KEY,
    workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    action VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    author_user VARCHAR(255) NOT NULL,
    diff JSONB
);

CREATE INDEX IF NOT EXISTS idx_org_chart_audits_workspace ON org_chart_audits(workspace_id, timestamp DESC);

-- 4. SOP DRAFTS & REPOSITORY
CREATE TABLE IF NOT EXISTS sop_drafts (
    id VARCHAR(100) PRIMARY KEY,
    workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    tenant_id VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    purpose TEXT,
    trigger VARCHAR(255),
    process_owner VARCHAR(255) NOT NULL,
    reviewer VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    version VARCHAR(50) NOT NULL DEFAULT '1.0',
    ordered_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    systems_used TEXT[] DEFAULT '{}',
    completion_evidence TEXT,
    expected_timing VARCHAR(100),
    revision_count INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sop_drafts_workspace_status ON sop_drafts(workspace_id, status);

-- 5. SOP AUDIT EVENTS
CREATE TABLE IF NOT EXISTS sop_audits (
    id VARCHAR(100) PRIMARY KEY,
    workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    action VARCHAR(100) NOT NULL,
    sop_id VARCHAR(100) NOT NULL,
    performed_by VARCHAR(255) NOT NULL,
    reason VARCHAR(255),
    snapshot JSONB
);

CREATE INDEX IF NOT EXISTS idx_sop_audits_workspace ON sop_audits(workspace_id, timestamp DESC);

-- 6. SOP AUTHORING REQUESTS
CREATE TABLE IF NOT EXISTS sop_authoring_requests (
    id VARCHAR(100) PRIMARY KEY,
    workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    raw_prompt TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    draft_sop_id VARCHAR(100) REFERENCES sop_drafts(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sop_authoring_requests_workspace ON sop_authoring_requests(workspace_id);

-- 7. OWNER DIGEST CONFIGURATION
CREATE TABLE IF NOT EXISTS owner_digest_configs (
    workspace_id VARCHAR(100) PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    recipients TEXT[] NOT NULL DEFAULT '{}',
    day_of_week VARCHAR(50) NOT NULL DEFAULT 'monday',
    delivery_time VARCHAR(50) NOT NULL DEFAULT '08:00',
    workspace_timezone VARCHAR(100) NOT NULL DEFAULT 'America/New_York',
    include_needs_attention BOOLEAN NOT NULL DEFAULT TRUE,
    include_open_requests BOOLEAN NOT NULL DEFAULT TRUE,
    include_resolved_last_week BOOLEAN NOT NULL DEFAULT TRUE,
    version INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(255) NOT NULL DEFAULT 'system'
);

-- 8. OWNER DIGEST DELIVERIES & IDEMPOTENCY
CREATE TABLE IF NOT EXISTS owner_digest_deliveries (
    id VARCHAR(100) PRIMARY KEY,
    workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    idempotency_key VARCHAR(255) UNIQUE NOT NULL,
    period_id VARCHAR(100) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    digest_type VARCHAR(50) NOT NULL DEFAULT 'weekly_owner_brief',
    mode VARCHAR(50) NOT NULL DEFAULT 'test_adapter',
    status VARCHAR(50) NOT NULL DEFAULT 'logged',
    html_body TEXT,
    text_body TEXT,
    delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_owner_digest_deliveries_workspace ON owner_digest_deliveries(workspace_id, delivered_at DESC);
