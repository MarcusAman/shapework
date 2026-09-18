-- Migration: 20260903120000_canonical_marketing_and_idempotency_schema.sql
-- Description: Create canonical marketing requests, tasks, inbound idempotency log, and outbound email outbox.

BEGIN;

-- 1. Inbound Email Idempotency Log (Multi-instance safe claiming & lease tracking)
CREATE TABLE IF NOT EXISTS inbound_email_idempotency_log (
  id VARCHAR(100) PRIMARY KEY,
  workspace_id VARCHAR(100) NOT NULL DEFAULT 'ws_wilmington',
  provider VARCHAR(50) NOT NULL DEFAULT 'google_workspace',
  mailbox_id VARCHAR(255) NOT NULL,
  message_id VARCHAR(255) NOT NULL,
  thread_id VARCHAR(255),
  sender_email VARCHAR(255) NOT NULL,
  processing_status VARCHAR(50) NOT NULL DEFAULT 'processing',
  attempt_count INTEGER NOT NULL DEFAULT 1,
  last_error_code VARCHAR(100),
  task_id VARCHAR(100),
  request_id VARCHAR(100),
  processing_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lease_expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes'),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_inbound_email_workspace_provider_mailbox_msg UNIQUE (workspace_id, provider, mailbox_id, message_id)
);

CREATE INDEX IF NOT EXISTS idx_inbound_email_lookup 
ON inbound_email_idempotency_log(workspace_id, provider, mailbox_id, message_id);

CREATE INDEX IF NOT EXISTS idx_inbound_email_status 
ON inbound_email_idempotency_log(processing_status, lease_expires_at);

-- 2. Transactional Outbound Email Outbox
CREATE TABLE IF NOT EXISTS outbound_email_outbox (
  id VARCHAR(100) PRIMARY KEY,
  workspace_id VARCHAR(100) NOT NULL DEFAULT 'ws_wilmington',
  message_type VARCHAR(100) NOT NULL,
  idempotency_key VARCHAR(255) UNIQUE NOT NULL,
  recipient VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  attempt_count INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lease_expires_at TIMESTAMPTZ,
  provider_message_id VARCHAR(255),
  last_error_code VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outbox_queue 
ON outbound_email_outbox(status, next_attempt_at) 
WHERE status IN ('pending', 'failed');

CREATE INDEX IF NOT EXISTS idx_outbox_key 
ON outbound_email_outbox(idempotency_key);

-- 3. Canonical Marketing Requests and Tasks Tables
CREATE TABLE IF NOT EXISTS canonical_marketing_requests (
  id VARCHAR(100) PRIMARY KEY,
  workspace_id VARCHAR(100) NOT NULL DEFAULT 'ws_wilmington',
  title VARCHAR(255) NOT NULL,
  property_address TEXT NOT NULL,
  normalized_property_key VARCHAR(255),
  agent_name VARCHAR(255) NOT NULL,
  agent_phone VARCHAR(50),
  agent_email VARCHAR(255),
  channel VARCHAR(50) NOT NULL DEFAULT 'web',
  status VARCHAR(50) NOT NULL DEFAULT 'request_received',
  category VARCHAR(100),
  task_ids TEXT[] NOT NULL DEFAULT '{}',
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  field_conflicts JSONB DEFAULT '[]'::jsonb,
  field_provenance JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS canonical_marketing_tasks (
  id VARCHAR(100) PRIMARY KEY,
  request_id VARCHAR(100) NOT NULL,
  workspace_id VARCHAR(100) NOT NULL DEFAULT 'ws_wilmington',
  request_title VARCHAR(255),
  property_address TEXT,
  agent_name VARCHAR(255),
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  assigned_to VARCHAR(255),
  assigned_to_role VARCHAR(100),
  status VARCHAR(50) NOT NULL DEFAULT 'request_received',
  due_at TIMESTAMPTZ,
  notes TEXT,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  archived_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  approval_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_canonical_mkt_tasks_req 
ON canonical_marketing_tasks(request_id, is_archived);

CREATE INDEX IF NOT EXISTS idx_canonical_mkt_tasks_assignee 
ON canonical_marketing_tasks(assigned_to, is_archived);

-- Ensure Columns on canonical_marketing_requests and canonical_marketing_tasks
ALTER TABLE canonical_marketing_requests 
ADD COLUMN IF NOT EXISTS normalized_property_key VARCHAR(255),
ADD COLUMN IF NOT EXISTS workspace_id VARCHAR(100) DEFAULT 'ws_wilmington';

ALTER TABLE canonical_marketing_tasks
ADD COLUMN IF NOT EXISTS workspace_id VARCHAR(100) DEFAULT 'ws_wilmington';

CREATE INDEX IF NOT EXISTS idx_canonical_mkt_req_ws 
ON canonical_marketing_requests(workspace_id, is_archived);

CREATE INDEX IF NOT EXISTS idx_canonical_mkt_req_prop_key 
ON canonical_marketing_requests(workspace_id, normalized_property_key);

COMMIT;
