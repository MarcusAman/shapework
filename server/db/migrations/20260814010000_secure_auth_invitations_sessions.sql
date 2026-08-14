-- ==============================================================================
-- MIGRATION: 20260814010000_secure_auth_invitations_sessions.sql
-- PURPOSE: Hardened Authentication, Single-Use Invitation & Reset Tokens, 
--          User Security Versions, and Structured Auth Audit Trail
-- ==============================================================================

-- 1. Extend Users table with security version, lockouts, and activation state
ALTER TABLE users ADD COLUMN IF NOT EXISTS security_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_failed_login_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ;

-- 2. Create Invitation Tokens Table (Hashed tokens, single-use, 24-hour expiration)
CREATE TABLE IF NOT EXISTS invitation_tokens (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  role VARCHAR(100) NOT NULL,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  used_by_ip VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invitation_tokens_hash ON invitation_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_invitation_tokens_user ON invitation_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_invitation_tokens_workspace ON invitation_tokens(workspace_id);

-- 3. Create Password Reset Tokens Table (Hashed tokens, single-use, 1-hour expiration)
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  used_by_ip VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_hash ON password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens(user_id);

-- 4. Create Structured Auth Audit Trail Table
CREATE TABLE IF NOT EXISTS auth_audit_logs (
  id VARCHAR(100) PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  user_id VARCHAR(100),
  email_redacted VARCHAR(255),
  workspace_id VARCHAR(100),
  ip_address VARCHAR(100),
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_audit_logs_event ON auth_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_auth_audit_logs_user ON auth_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_audit_logs_workspace ON auth_audit_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_auth_audit_logs_created_at ON auth_audit_logs(created_at DESC);

-- 5. Revoke and disable all existing default passwords in UAT
UPDATE users 
SET password_hash = NULL, 
    status = 'pending_activation', 
    security_version = security_version + 1
WHERE email LIKE '%@nestrealty.com' OR email LIKE '%@nest.com';
