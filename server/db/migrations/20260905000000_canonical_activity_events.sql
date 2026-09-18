-- Migration: 20260905000000_canonical_activity_events.sql
-- Description: Additive append-only ledger for canonical activity and contact history events.

BEGIN;

CREATE TABLE IF NOT EXISTS canonical_activity_events (
  id VARCHAR(100) PRIMARY KEY,
  workspace_id VARCHAR(100) NOT NULL DEFAULT 'ws_wilmington' REFERENCES workspaces(id) ON DELETE CASCADE,
  request_id VARCHAR(100) NOT NULL,
  task_id VARCHAR(100),
  call_id VARCHAR(100),
  event_type VARCHAR(100) NOT NULL,
  actor_type VARCHAR(50) NOT NULL DEFAULT 'system',
  actor_id VARCHAR(100),
  actor_display_name VARCHAR(255) NOT NULL,
  channel VARCHAR(50),
  direction VARCHAR(50),
  communication_status VARCHAR(50),
  summary TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  idempotency_key VARCHAR(255) UNIQUE NOT NULL,
  provider_message_id VARCHAR(255),
  correlation_id VARCHAR(255),
  occurred_at TIMESTAMPTZ NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Compound indexes for high-frequency timeline queries
CREATE INDEX IF NOT EXISTS idx_activity_events_ws_req 
ON canonical_activity_events(workspace_id, request_id, occurred_at ASC);

CREATE INDEX IF NOT EXISTS idx_activity_events_ws_task 
ON canonical_activity_events(workspace_id, task_id, occurred_at ASC);

CREATE INDEX IF NOT EXISTS idx_activity_events_call 
ON canonical_activity_events(call_id);

CREATE INDEX IF NOT EXISTS idx_activity_events_type 
ON canonical_activity_events(event_type);

CREATE INDEX IF NOT EXISTS idx_activity_events_idemp 
ON canonical_activity_events(idempotency_key);

COMMIT;
