-- Migration: 20260907190000_nora_followup_emails_ledger.sql
-- Description: Creates persistent ledger for NORA follow-up emails with idempotency constraint and enriches telephony_calls.

BEGIN;

-- 1. Create NORA Follow-Up Emails Ledger Table
CREATE TABLE IF NOT EXISTS nora_followup_emails (
  id VARCHAR(100) PRIMARY KEY,
  conversation_id VARCHAR(100) NOT NULL,
  conversation_channel VARCHAR(50) NOT NULL DEFAULT 'voice',
  idempotency_key VARCHAR(255) NOT NULL UNIQUE,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255) NOT NULL,
  represented_agent_id VARCHAR(100),
  caller_name VARCHAR(255),
  caller_phone VARCHAR(50),
  intent VARCHAR(100),
  subject VARCHAR(255) NOT NULL,
  body_text TEXT NOT NULL,
  body_html TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  error_message TEXT,
  message_id VARCHAR(100),
  knowledge_assertion_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  sop_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  resource_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Indexes for fast lookup by conversation, recipient, and status
CREATE INDEX IF NOT EXISTS idx_nora_followup_conversation
ON nora_followup_emails(conversation_id);

CREATE INDEX IF NOT EXISTS idx_nora_followup_recipient
ON nora_followup_emails(recipient_email);

CREATE INDEX IF NOT EXISTS idx_nora_followup_status
ON nora_followup_emails(status);

-- 3. Enrich telephony_calls table with follow-up outcome columns
ALTER TABLE telephony_calls 
ADD COLUMN IF NOT EXISTS follow_up_email_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS follow_up_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS follow_up_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS conversation_goal TEXT,
ADD COLUMN IF NOT EXISTS knowledge_used_summary JSONB DEFAULT '[]'::jsonb;

COMMIT;
