-- Migration: 20260904180000_telephony_calls_persistent_ledger.sql
-- Description: Creates persistent PostgreSQL ledger for inbound & outbound telephony call records, audio URLs, and transcript audits.

BEGIN;

-- 1. Create Telephony Calls Table
CREATE TABLE IF NOT EXISTS telephony_calls (
  id VARCHAR(100) PRIMARY KEY,
  workspace_id VARCHAR(100) NOT NULL DEFAULT 'ws_wilmington',
  agent_id VARCHAR(100) NOT NULL DEFAULT 'agent_cdd031880770993e4b11cb9340',
  caller_name VARCHAR(255),
  caller_phone VARCHAR(50),
  caller_office VARCHAR(255),
  direction VARCHAR(20) NOT NULL DEFAULT 'inbound',
  status VARCHAR(50) NOT NULL DEFAULT 'completed',
  disconnection_reason VARCHAR(100),
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  duration_formatted VARCHAR(50),
  property_address TEXT,
  request_type VARCHAR(100) DEFAULT 'General Inbound',
  department_category VARCHAR(100) NOT NULL DEFAULT 'general_ops',
  assigned_lead VARCHAR(255) DEFAULT 'Ann Gunn (Operations Lead)',
  transcript TEXT,
  recording_url TEXT,
  audio_url TEXT,
  call_analysis JSONB DEFAULT '{}'::jsonb,
  ai_extracted_details JSONB DEFAULT '{}'::jsonb,
  broker_details JSONB DEFAULT '{}'::jsonb,
  canonical_request_id VARCHAR(100),
  canonical_task_id VARCHAR(100),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Indexes for fast retrieval by workspace and caller
CREATE INDEX IF NOT EXISTS idx_telephony_calls_workspace_time
ON telephony_calls(workspace_id, started_at DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_telephony_calls_phone
ON telephony_calls(caller_phone);

CREATE INDEX IF NOT EXISTS idx_telephony_calls_req_id
ON telephony_calls(canonical_request_id);

-- 3. Transactionally backfill existing placeholder property addresses to NULL
-- Placeholders (Pending, Needed, New Listing, Inbound Phone Request, etc.) must NOT have unique property keys
UPDATE canonical_marketing_requests
SET normalized_property_key = NULL
WHERE is_archived = FALSE
  AND (
    normalized_property_key IS NULL
    OR normalized_property_key = ''
    OR LOWER(normalized_property_key) LIKE '%pending%'
    OR LOWER(normalized_property_key) LIKE '%needed%'
    OR LOWER(normalized_property_key) LIKE '%new listing%'
    OR LOWER(normalized_property_key) LIKE '%inbound phone%'
    OR LOWER(normalized_property_key) LIKE '%area listing%'
    OR LOWER(property_address) LIKE '%pending%'
    OR LOWER(property_address) LIKE '%needed%'
    OR LOWER(property_address) LIKE '%new listing%'
    OR LOWER(property_address) LIKE '%inbound phone%'
    OR LOWER(property_address) LIKE '%area listing%'
  );

-- 4. Diagnostic check: detect genuine active duplicate properties across workspaces
-- Abort migration with diagnostic details if true duplicates exist so real data is preserved
DO $$
DECLARE
  dupe_count INTEGER;
  diagnostic_details TEXT := '';
BEGIN
  SELECT COUNT(*) INTO dupe_count
  FROM (
    SELECT workspace_id, normalized_property_key
    FROM canonical_marketing_requests
    WHERE is_archived = FALSE 
      AND normalized_property_key IS NOT NULL
    GROUP BY workspace_id, normalized_property_key
    HAVING COUNT(*) > 1
  ) d;

  IF dupe_count > 0 THEN
    SELECT string_agg(format('Workspace %s: Key %s (Count: %s, IDs: %s)', workspace_id, normalized_property_key, cnt, ids), E'\n')
    INTO diagnostic_details
    FROM (
      SELECT workspace_id, normalized_property_key, COUNT(*) as cnt, array_to_string(array_agg(id), ', ') as ids
      FROM canonical_marketing_requests
      WHERE is_archived = FALSE 
        AND normalized_property_key IS NOT NULL
      GROUP BY workspace_id, normalized_property_key
      HAVING COUNT(*) > 1
    ) sub;

    RAISE EXCEPTION 'MIGRATION_ABORTED: % genuine duplicate active property record(s) found in canonical_marketing_requests. Manual deduplication required before applying unique index:%', dupe_count, E'\n' || diagnostic_details;
  END IF;
END $$;

-- 5. Restore clean canonical unique index on active non-null normalized_property_key
DROP INDEX IF EXISTS uq_active_canonical_mkt_req_prop;

CREATE UNIQUE INDEX uq_active_canonical_mkt_req_prop 
ON canonical_marketing_requests(workspace_id, normalized_property_key) 
WHERE is_archived = FALSE 
  AND normalized_property_key IS NOT NULL;

COMMIT;
