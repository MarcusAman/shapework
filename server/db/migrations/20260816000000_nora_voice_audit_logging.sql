-- Migration: NORA Voice Audit Logging & Omnichannel Session Persistence
-- Date: 2026-08-16
-- Description: Creates tables for recording multi-turn NORA voice interactions, matched SOP references, escalation tickets, and compliance audit records.

CREATE TABLE IF NOT EXISTS nora_voice_conversations (
    id VARCHAR(64) PRIMARY KEY,
    workspace_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64),
    user_name VARCHAR(255),
    channel VARCHAR(32) NOT NULL DEFAULT 'webrtc_browser', -- 'webrtc_browser', 'phone_twilio', 'sms'
    status VARCHAR(32) NOT NULL DEFAULT 'active', -- 'active', 'completed', 'escalated'
    turns_count INTEGER NOT NULL DEFAULT 0,
    last_sop_id VARCHAR(64),
    last_sop_title VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nora_voice_conv_ws ON nora_voice_conversations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_nora_voice_conv_user ON nora_voice_conversations(user_id);

CREATE TABLE IF NOT EXISTS nora_voice_turns (
    id VARCHAR(64) PRIMARY KEY,
    conversation_id VARCHAR(64) NOT NULL REFERENCES nora_voice_conversations(id) ON DELETE CASCADE,
    workspace_id VARCHAR(64) NOT NULL,
    turn_index INTEGER NOT NULL,
    speaker VARCHAR(32) NOT NULL, -- 'user', 'nora', 'system'
    query_text TEXT,
    spoken_response TEXT,
    display_response TEXT,
    matched_domain VARCHAR(64),
    matched_sop_id VARCHAR(64),
    matched_sop_title VARCHAR(255),
    confidence VARCHAR(32),
    needs_escalation BOOLEAN DEFAULT FALSE,
    latency_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nora_voice_turns_conv ON nora_voice_turns(conversation_id);
CREATE INDEX IF NOT EXISTS idx_nora_voice_turns_sop ON nora_voice_turns(matched_sop_id);
