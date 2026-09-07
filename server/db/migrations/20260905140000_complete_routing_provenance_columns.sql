-- Migration: 20260905140000_complete_routing_provenance_columns.sql
-- Description: Additive explicit provenance columns on canonical_marketing_tasks for audit reproducibility.

BEGIN;

ALTER TABLE canonical_marketing_tasks
ADD COLUMN IF NOT EXISTS routing_policy_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS fulfillment_role_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS original_review_owner_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS review_covering_staff_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS original_assignee_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS assignee_covering_staff_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS classification_confidence NUMERIC(4,3),
ADD COLUMN IF NOT EXISTS routed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_canonical_mkt_tasks_policy_rule 
ON canonical_marketing_tasks(routing_policy_id, routing_rule_id);

CREATE INDEX IF NOT EXISTS idx_canonical_mkt_tasks_routed_at 
ON canonical_marketing_tasks(routed_at DESC);

COMMIT;
