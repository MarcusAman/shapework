-- Migration: 20260904120000_notification_preferences_and_canonical_staff_coverage.sql
-- Description: Additive schema for user notification preferences, operations directory staff, and canonical task coverage/review columns.

BEGIN;

-- 1. User Notification Preferences Table
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  user_id VARCHAR(100) PRIMARY KEY,
  workspace_id VARCHAR(100) NOT NULL DEFAULT 'ws_wilmington',
  email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  sms_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  preferred_channel VARCHAR(20) NOT NULL DEFAULT 'both',
  quiet_hours_start VARCHAR(10) NOT NULL DEFAULT '17:00',
  quiet_hours_end VARCHAR(10) NOT NULL DEFAULT '09:00',
  timezone VARCHAR(50) NOT NULL DEFAULT 'America/New_York',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_notification_preferences
  ADD COLUMN IF NOT EXISTS workspace_id VARCHAR(100) NOT NULL DEFAULT 'ws_wilmington';

CREATE INDEX IF NOT EXISTS idx_user_notif_prefs_workspace
ON user_notification_preferences(workspace_id);

-- 2. Operations Directory Staff Profiles Table
CREATE TABLE IF NOT EXISTS operations_directory_staff (
  id VARCHAR(100) PRIMARY KEY,
  workspace_id VARCHAR(100) NOT NULL DEFAULT 'ws_wilmington',
  full_name VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  role VARCHAR(50) NOT NULL DEFAULT 'marketing_specialist',
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  avatar_url TEXT,
  active_workload_count INTEGER NOT NULL DEFAULT 0,
  max_workload_capacity INTEGER NOT NULL DEFAULT 10,
  skills TEXT[] DEFAULT '{}',
  escalation_contact_id VARCHAR(100),
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  backup_staff_id VARCHAR(100),
  backup_staff_name VARCHAR(255),
  out_of_office_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE operations_directory_staff
  ADD COLUMN IF NOT EXISTS workspace_id VARCHAR(100) NOT NULL DEFAULT 'ws_wilmington';

CREATE INDEX IF NOT EXISTS idx_ops_dir_staff_lookup
ON operations_directory_staff(workspace_id, status);

CREATE INDEX IF NOT EXISTS idx_ops_dir_staff_email
ON operations_directory_staff(email);

-- 3. Additive columns for Canonical Marketing Tasks (Canonical Staff IDs & Design Proof Review States)
ALTER TABLE canonical_marketing_tasks
  ADD COLUMN IF NOT EXISTS assigned_to_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS review_owner_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS review_owner_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS covering_staff_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS covering_staff_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS coverage_history JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS review_state VARCHAR(50),
  ADD COLUMN IF NOT EXISTS proof_version INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS proof_history JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS review_history JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_canonical_tasks_assigned_id
ON canonical_marketing_tasks(assigned_to_id);

CREATE INDEX IF NOT EXISTS idx_canonical_tasks_covering_id
ON canonical_marketing_tasks(covering_staff_id);

CREATE INDEX IF NOT EXISTS idx_canonical_tasks_review_state
ON canonical_marketing_tasks(review_state);

-- 4. Additive columns for Canonical Marketing Requests (Immutable Creator & Proxy)
ALTER TABLE canonical_marketing_requests
  ADD COLUMN IF NOT EXISTS created_by_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS created_by_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS on_behalf_of VARCHAR(255);

COMMIT;
