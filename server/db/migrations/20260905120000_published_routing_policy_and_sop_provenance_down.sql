-- Rollback Migration: 20260905120000_published_routing_policy_and_sop_provenance_down.sql

BEGIN;

DROP TABLE IF EXISTS published_routing_rules CASCADE;
DROP TABLE IF EXISTS published_routing_policies CASCADE;

ALTER TABLE canonical_marketing_tasks
DROP COLUMN IF EXISTS governing_sop_id,
DROP COLUMN IF EXISTS governing_sop_version,
DROP COLUMN IF EXISTS routing_rule_id,
DROP COLUMN IF EXISTS routing_policy_version,
DROP COLUMN IF EXISTS department_id,
DROP COLUMN IF EXISTS primary_role_id,
DROP COLUMN IF EXISTS review_role_id,
DROP COLUMN IF EXISTS review_owner_id,
DROP COLUMN IF EXISTS assignee_staff_id,
DROP COLUMN IF EXISTS original_staff_id,
DROP COLUMN IF EXISTS covering_staff_id,
DROP COLUMN IF EXISTS routing_state,
DROP COLUMN IF EXISTS routing_reasons,
DROP COLUMN IF EXISTS routing_snapshot;

COMMIT;
