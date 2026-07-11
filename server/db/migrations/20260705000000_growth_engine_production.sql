-- Production Readiness Migration: Campaigns Freshness, Job Queue, and Observability Logs

-- 1. Campaign Freshness Trackers
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS compliance_checked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS compliance_snapshot_hash VARCHAR(128),
ADD COLUMN IF NOT EXISTS campaign_last_changed_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS audience_last_changed_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS approved_by VARCHAR(100),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- 2. Send Jobs Queue Table
CREATE TABLE IF NOT EXISTS growth_send_jobs (
    id VARCHAR(100) PRIMARY KEY,
    workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    campaign_id VARCHAR(100) NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    contact_id VARCHAR(100) NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    step_id VARCHAR(100) REFERENCES campaign_steps(id) ON DELETE SET NULL,
    email_message_id VARCHAR(100) REFERENCES email_messages(id) ON DELETE SET NULL,
    sending_domain_id VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'queued',
    attempts INTEGER NOT NULL DEFAULT 0,
    last_attempt_at TIMESTAMPTZ,
    next_attempt_at TIMESTAMPTZ,
    provider VARCHAR(50),
    provider_message_id VARCHAR(255),
    sanitized_error_code VARCHAR(100),
    sanitized_error_message TEXT,
    error TEXT,
    scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure growth_send_jobs columns exist for existing databases
ALTER TABLE growth_send_jobs
ADD COLUMN IF NOT EXISTS email_message_id VARCHAR(100) REFERENCES email_messages(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS sending_domain_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS next_attempt_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS provider VARCHAR(50),
ADD COLUMN IF NOT EXISTS provider_message_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS sanitized_error_code VARCHAR(100),
ADD COLUMN IF NOT EXISTS sanitized_error_message TEXT;

-- 3. Provider Observability Logs Table
CREATE TABLE IF NOT EXISTS provider_logs (
    id VARCHAR(100) PRIMARY KEY,
    workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    mode VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    request_metadata JSONB,
    response_metadata JSONB,
    provider_object_id VARCHAR(255),
    provider_event_id VARCHAR(255),
    error_code VARCHAR(100),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure provider_logs columns exist for existing databases
ALTER TABLE provider_logs
ADD COLUMN IF NOT EXISTS mode VARCHAR(50),
ADD COLUMN IF NOT EXISTS provider_event_id VARCHAR(255);

-- Ensure email_events has provider_event_id column for idempotency tracking
ALTER TABLE email_events
ADD COLUMN IF NOT EXISTS provider_event_id VARCHAR(255);

-- 4. Queue and Job Indexes
CREATE INDEX IF NOT EXISTS idx_growth_send_jobs_workspace_id ON growth_send_jobs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_growth_send_jobs_campaign_id ON growth_send_jobs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_growth_send_jobs_status ON growth_send_jobs(status);
CREATE INDEX IF NOT EXISTS idx_growth_send_jobs_scheduled_at ON growth_send_jobs(scheduled_at);
