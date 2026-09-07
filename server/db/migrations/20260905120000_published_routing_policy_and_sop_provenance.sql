-- Migration: 20260905120000_published_routing_policy_and_sop_provenance.sql
-- Description: Additive persistence for published SOP routing policies, executable rules, and immutable task SOP provenance snapshots.

BEGIN;

-- 1. Published Routing Policies Table (Workspace-scoped, versioned routing policies)
CREATE TABLE IF NOT EXISTS published_routing_policies (
  id VARCHAR(100) PRIMARY KEY,
  workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  published_by VARCHAR(255) NOT NULL,
  published_by_user_id VARCHAR(100),
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  rules_count INTEGER NOT NULL DEFAULT 0,
  validation_hash VARCHAR(64),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_routing_policy_ws_version UNIQUE (workspace_id, version)
);

CREATE INDEX IF NOT EXISTS idx_published_policy_ws_active 
ON published_routing_policies(workspace_id, is_active);

-- 2. Published Routing Rules Table (Executable rules evaluated at intake)
CREATE TABLE IF NOT EXISTS published_routing_rules (
  id VARCHAR(100) PRIMARY KEY,
  policy_id VARCHAR(100) NOT NULL REFERENCES published_routing_policies(id) ON DELETE CASCADE,
  workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  rule_index INTEGER NOT NULL DEFAULT 0,
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  display_name VARCHAR(255),
  match_keywords TEXT[] DEFAULT '{}',
  office_condition JSONB,
  primary_position_id VARCHAR(100) NOT NULL,
  primary_role_id VARCHAR(100),
  primary_staff_id VARCHAR(100) NOT NULL,
  review_position_id VARCHAR(100),
  review_role_id VARCHAR(100),
  review_staff_id VARCHAR(100),
  backup_position_id VARCHAR(100),
  backup_staff_id VARCHAR(100),
  governing_sop_id VARCHAR(100),
  governing_sop_version VARCHAR(50),
  sla_hours INTEGER DEFAULT 24,
  sla_display VARCHAR(50) DEFAULT '24 hours',
  escalation_policy_id VARCHAR(100),
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_published_rules_policy 
ON published_routing_rules(policy_id, rule_index ASC);

CREATE INDEX IF NOT EXISTS idx_published_rules_ws_category 
ON published_routing_rules(workspace_id, category);

-- 3. Additive SOP Provenance & Routing Snapshot Columns on canonical_marketing_tasks
ALTER TABLE canonical_marketing_tasks
ADD COLUMN IF NOT EXISTS governing_sop_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS governing_sop_version VARCHAR(50),
ADD COLUMN IF NOT EXISTS routing_rule_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS routing_policy_version INTEGER,
ADD COLUMN IF NOT EXISTS department_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS primary_role_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS review_role_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS review_owner_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS assignee_staff_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS original_staff_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS covering_staff_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS routing_state VARCHAR(50) NOT NULL DEFAULT 'resolved',
ADD COLUMN IF NOT EXISTS routing_reasons TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS routing_snapshot JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_canonical_mkt_tasks_sop 
ON canonical_marketing_tasks(governing_sop_id, governing_sop_version);

CREATE INDEX IF NOT EXISTS idx_canonical_mkt_tasks_routing_state 
ON canonical_marketing_tasks(workspace_id, routing_state);

CREATE INDEX IF NOT EXISTS idx_canonical_mkt_tasks_review_owner 
ON canonical_marketing_tasks(review_owner_id, is_archived);

COMMIT;
