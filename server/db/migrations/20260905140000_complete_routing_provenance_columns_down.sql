-- Migration Down: 20260905140000_complete_routing_provenance_columns_down.sql
-- Description: Revert additive explicit routing provenance columns from canonical_marketing_tasks.

BEGIN;

DROP INDEX IF EXISTS idx_canonical_mkt_tasks_routed_at;
DROP INDEX IF EXISTS idx_canonical_mkt_tasks_policy_rule;

ALTER TABLE canonical_marketing_tasks
DROP COLUMN IF EXISTS routed_at,
DROP COLUMN IF EXISTS classification_confidence,
DROP COLUMN IF EXISTS assignee_covering_staff_id,
DROP COLUMN IF EXISTS original_assignee_id,
DROP COLUMN IF EXISTS review_covering_staff_id,
DROP COLUMN IF EXISTS original_review_owner_id,
DROP COLUMN IF EXISTS fulfillment_role_id,
DROP COLUMN IF EXISTS routing_policy_id;

COMMIT;
